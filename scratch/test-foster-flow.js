import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in your environment/env-file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function run() {
  console.log('=== STARTING FOSTER WORKFLOW E2E PROGRAMMATIC VERIFICATION ===');
  
  try {
    // 1. Sign in as staff to run administrative operations
    console.log('Signing in as staff...');
    const email = process.env.TEST_STAFF_EMAIL || 'test-staff@happypawsrescuehaven.com';
    const password = process.env.TEST_STAFF_PASSWORD || 'Password123!';
    
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authErr) throw authErr;
    console.log('Successfully signed in as staff user ID:', authData.user.id);
    
    // 2. Fetch or create a test pet
    const { data: pets, error: petsErr } = await supabase
      .from('pets')
      .select('id, name, current_location')
      .eq('status', 'AVAILABLE')
      .limit(1);
      
    if (petsErr) throw petsErr;
    
    let petId;
    let isTempPet = false;
    if (pets && pets.length > 0) {
      petId = pets[0].id;
      console.log(`Using existing available pet: ${pets[0].name} (${petId})`);
    } else {
      console.log('No AVAILABLE pets found. Creating a temporary test pet...');
      const { data: tempPet, error: tempPetErr } = await supabase
        .from('pets')
        .insert({
          name: 'E2E Temporary Dog',
          species: 'Dog',
          breed: 'Labrador',
          age: '2 years',
          gender: 'Male',
          description: 'A friendly temporary dog for E2E testing.',
          status: 'AVAILABLE',
          case_number: 'E2E-TEMP-' + Date.now(),
          intake_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();
      if (tempPetErr) throw tempPetErr;
      petId = tempPet.id;
      isTempPet = true;
      console.log(`Created temporary test pet: ${tempPet.name} (${petId})`);
    }

    // 3. Submit foster application
    console.log('Submitting foster application...');
    const { data: newApp, error: appErr } = await supabase
      .from('foster_volunteer_applications')
      .insert({
        full_name: 'E2E Programmatic Test Foster',
        email: `foster_e2e_${Date.now()}@example.com`,
        phone: '555-0199',
        address: '789 Test Lane, Cleveland, OH 44101',
        role_interest: 'FOSTER',
        experience_details: 'Experienced dog foster.',
        housing_type: 'house',
        has_other_pets: false,
        age_confirmed: true,
        status: 'SUBMITTED'
      })
      .select()
      .single();

    if (appErr) throw appErr;
    console.log('Successfully inserted application ID:', newApp.id);

    // 4. Approve application
    console.log('Approving application...');
    const { error: approveErr } = await supabase
      .from('foster_volunteer_applications')
      .update({
        status: 'APPROVED',
        reviewed_by: authData.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', newApp.id);

    if (approveErr) throw approveErr;
    console.log('Application approved.');

    // 5. Create foster assignment and change pet status
    console.log('Assigning pet to approved foster...');
    const { data: newAssignment, error: assignErr } = await supabase
      .from('foster_assignments')
      .insert({
        application_id: newApp.id,
        pet_id: petId,
        status: 'ASSIGNED',
        assigned_by: authData.user.id,
        assigned_at: new Date().toISOString(),
        deposit_terms_agreed: false
      })
      .select()
      .single();

    if (assignErr) throw assignErr;
    console.log('Created foster assignment ID:', newAssignment.id);

    const { error: petStatusErr } = await supabase
      .from('pets')
      .update({ status: 'IN_FOSTER' })
      .eq('id', petId);

    if (petStatusErr) throw petStatusErr;
    console.log('Pet status updated to IN_FOSTER.');

    // Fetch active active transport tier
    const { data: tiers, error: tiersErr } = await supabase.from('transport_fee_tiers').select('id').eq('is_active', true).limit(1);
    if (tiersErr) throw tiersErr;
    const tierId = tiers && tiers.length > 0 ? tiers[0].id : null;

    // Fetch active active bank account
    const { data: accounts } = await supabase.from('bank_accounts').select('id').eq('is_active', true).limit(1);
    const bankId = accounts && accounts.length > 0 ? accounts[0].id : null;

    // ==========================================
    // SCENARIO A: MI resident (Deposit waived)
    // ==========================================
    console.log('\n--- SCENARIO A: MI Resident (Waived Deposit) ---');
    console.log('Testing submit_foster_coordination for MI (Waiver active)...');
    const { error: coordErr1 } = await supabase.rpc('submit_foster_coordination', {
      assignment_id: newAssignment.id,
      foster_address: '123 Detroit St, Detroit, MI 48201',
      foster_state: 'MI',
      lat: 42.3314,
      lng: -83.0458,
      distance: 2.5,
      fee_amount: 25.00,
      fee_tier_id: tierId,
      deposit_required: false
    });
    if (coordErr1) throw coordErr1;

    // Verify status is QUOTE_GENERATED
    const { data: trA1 } = await supabase.from('transport_requests').select('*').eq('foster_assignment_id', newAssignment.id).single();
    console.log('Scenario A initially transport_requests status:', trA1.status);
    if (trA1.status !== 'QUOTE_GENERATED') throw new Error('Status should be QUOTE_GENERATED');

    // Submit transport fee proof
    console.log('Submitting Scenario A transport fee proof...');
    const { data: proofA1, error: pErrA1 } = await supabase.from('payment_proofs').insert({
      transport_request_id: trA1.id,
      bank_account_id: bankId,
      proof_image_url: 'transport-fees/test-a.jpg',
      amount_claimed: 25.00,
      reference_note: 'Scenario A transport fee proof',
      purpose: 'TRANSPORT_FEE',
      status: 'PENDING_REVIEW'
    }).select().single();
    if (pErrA1) throw pErrA1;

    // Update status to simulating admin approval (directly setting status to TRACKING_ACTIVE because deposit is waived!)
    console.log('Simulating admin approval for Scenario A...');
    const { error: approveAErr } = await supabase.from('transport_requests').update({
      status: 'TRACKING_ACTIVE',
      tracking_id: 'TRK-E2E-A-' + Date.now()
    }).eq('id', trA1.id);
    if (approveAErr) throw approveAErr;

    const { data: trA2 } = await supabase.from('transport_requests').select('*').eq('id', trA1.id).single();
    console.log('Scenario A approved transport status:', trA2.status, 'tracking_id:', trA2.tracking_id);
    if (trA2.status !== 'TRACKING_ACTIVE') throw new Error('Status should be TRACKING_ACTIVE');

    // Clean up Scenario A transport request for Scenario B
    await supabase.from('payment_proofs').delete().eq('transport_request_id', trA1.id);
    await supabase.from('transport_requests').delete().eq('id', trA1.id);

    // ==========================================
    // SCENARIO B: OH resident (Deposit required)
    // ==========================================
    console.log('\n--- SCENARIO B: OH Resident (Deposit Required) ---');
    console.log('Testing submit_foster_coordination for OH (Deposit required)...');
    const { error: coordErr2 } = await supabase.rpc('submit_foster_coordination', {
      assignment_id: newAssignment.id,
      foster_address: '456 Cleveland Ave, Cleveland, OH 44101',
      foster_state: 'OH',
      lat: 41.4993,
      lng: -81.6944,
      distance: 170.0,
      fee_amount: 85.00,
      fee_tier_id: tierId,
      deposit_required: true
    });
    if (coordErr2) throw coordErr2;

    const { data: trB1 } = await supabase.from('transport_requests').select('*').eq('foster_assignment_id', newAssignment.id).single();
    console.log('Scenario B initially transport_requests status:', trB1.status);
    if (trB1.status !== 'QUOTE_GENERATED') throw new Error('Status should be QUOTE_GENERATED');

    // Submit transport fee proof
    console.log('Submitting Scenario B transport fee proof...');
    const { data: proofB1, error: pErrB1 } = await supabase.from('payment_proofs').insert({
      transport_request_id: trB1.id,
      bank_account_id: bankId,
      proof_image_url: 'transport-fees/test-b.jpg',
      amount_claimed: 85.00,
      reference_note: 'Scenario B transport fee proof',
      purpose: 'TRANSPORT_FEE',
      status: 'PENDING_REVIEW'
    }).select().single();
    if (pErrB1) throw pErrB1;

    // Simulate Admin approval for transport fee -> sets status to DEPOSIT_PENDING and creates security_deposits row
    console.log('Simulating admin approval for Scenario B transport fee...');
    const { data: settingsData } = await supabase.from('app_settings').select('value').eq('key', 'security_deposit_amount').maybeSingle();
    const depositAmount = parseFloat(settingsData?.value || '100.00');

    const { data: depositObjB, error: depErrB } = await supabase.from('security_deposits').insert({
      transport_request_id: trB1.id,
      amount: depositAmount,
      currency: 'USD',
      status: 'PENDING'
    }).select().single();
    if (depErrB) throw depErrB;

    const { error: trApproveBErr } = await supabase.from('transport_requests').update({
      status: 'DEPOSIT_PENDING',
      security_deposit_id: depositObjB.id
    }).eq('id', trB1.id);
    if (trApproveBErr) throw trApproveBErr;

    // Sign Terms Gate
    console.log('Signing Terms Gate...');
    const { error: termsErr } = await supabase.rpc('submit_foster_terms_agreement', {
      assignment_id: newAssignment.id
    });
    if (termsErr) throw termsErr;

    // Submit deposit proof
    console.log('Submitting Scenario B security deposit proof...');
    const { data: proofB2, error: pErrB2 } = await supabase.from('payment_proofs').insert({
      transport_request_id: trB1.id,
      bank_account_id: bankId,
      proof_image_url: 'security-deposits/test-b.jpg',
      amount_claimed: depositAmount,
      reference_note: 'Scenario B deposit proof',
      purpose: 'SECURITY_DEPOSIT',
      status: 'PENDING_REVIEW'
    }).select().single();
    if (pErrB2) throw pErrB2;

    // Update status to DEPOSIT_PROOF_SUBMITTED
    const { error: trProofB } = await supabase.from('transport_requests').update({
      status: 'DEPOSIT_PROOF_SUBMITTED'
    }).eq('id', trB1.id);
    if (trProofB) throw trProofB;

    const { data: trB2 } = await supabase.from('transport_requests').select('*').eq('id', trB1.id).single();
    console.log('Scenario B deposit uploaded status:', trB2.status);
    if (trB2.status !== 'DEPOSIT_PROOF_SUBMITTED') throw new Error('Status should be DEPOSIT_PROOF_SUBMITTED');

    // Simulate Admin approval for security deposit -> sets status to TRACKING_ACTIVE
    console.log('Simulating admin approval for Scenario B security deposit...');
    await supabase.from('security_deposits').update({ status: 'PAID', paid_at: new Date().toISOString() }).eq('id', depositObjB.id);
    await supabase.from('transport_requests').update({
      status: 'TRACKING_ACTIVE',
      tracking_id: 'TRK-E2E-B-' + Date.now(),
      tracking_activated_at: new Date().toISOString()
    }).eq('id', trB1.id);

    const { data: trB3 } = await supabase.from('transport_requests').select('*').eq('id', trB1.id).single();
    console.log('Scenario B approved tracking status:', trB3.status, 'tracking_id:', trB3.tracking_id);
    if (trB3.status !== 'TRACKING_ACTIVE') throw new Error('Status should be TRACKING_ACTIVE');

    // Clean up Scenario B transport request for Scenario C
    await supabase.from('payment_proofs').delete().eq('transport_request_id', trB1.id);
    await supabase.from('security_deposits').delete().eq('transport_request_id', trB1.id);
    await supabase.from('transport_requests').delete().eq('id', trB1.id);

    // ==========================================
    // SCENARIO C: Self-Pickup (Deposit required)
    // ==========================================
    console.log('\n--- SCENARIO C: Self-Pickup (Deposit Required) ---');
    console.log('Testing submit_foster_pickup_choice...');
    
    // Reset assignment status first
    await supabase.from('foster_assignments').update({ status: 'ASSIGNED', deposit_terms_agreed: false }).eq('id', newAssignment.id);

    const { error: pickupErr } = await supabase.rpc('submit_foster_pickup_choice', {
      assignment_id: newAssignment.id
    });
    if (pickupErr) throw pickupErr;

    const { data: trC1 } = await supabase.from('transport_requests').select('*').eq('foster_assignment_id', newAssignment.id).single();
    console.log('Scenario C initially transport_requests status:', trC1.status, 'pickup_method:', trC1.pickup_method);
    if (trC1.status !== 'DEPOSIT_PENDING' || trC1.pickup_method !== 'self_pickup') {
      throw new Error('Self-pickup transport request is misconfigured!');
    }
    if (!trC1.security_deposit_id) throw new Error('Security deposit not automatically created for self-pickup!');

    // Sign terms
    await supabase.rpc('submit_foster_terms_agreement', { assignment_id: newAssignment.id });

    // Submit deposit proof
    console.log('Submitting Scenario C deposit proof...');
    const { data: proofC, error: pErrC } = await supabase.from('payment_proofs').insert({
      transport_request_id: trC1.id,
      bank_account_id: bankId,
      proof_image_url: 'security-deposits/test-c.jpg',
      amount_claimed: depositAmount,
      reference_note: 'Scenario C deposit proof',
      purpose: 'SECURITY_DEPOSIT',
      status: 'PENDING_REVIEW'
    }).select().single();
    if (pErrC) throw pErrC;

    // Simulate Admin approval for self-pickup security deposit -> sets status to SELF_PICKUP_CONFIRMED
    console.log('Simulating admin approval for Scenario C self-pickup security deposit...');
    await supabase.from('security_deposits').update({ status: 'PAID', paid_at: new Date().toISOString() }).eq('id', trC1.security_deposit_id);
    await supabase.from('transport_requests').update({
      status: 'SELF_PICKUP_CONFIRMED'
    }).eq('id', trC1.id);

    const { data: trC2 } = await supabase.from('transport_requests').select('*').eq('id', trC1.id).single();
    console.log('Scenario C approved pickup status:', trC2.status);
    if (trC2.status !== 'SELF_PICKUP_CONFIRMED') throw new Error('Status should be SELF_PICKUP_CONFIRMED');

    // Cleanup and complete
    console.log('\nCleaning up E2E verification dummy data...');
    await supabase.from('payment_proofs').delete().eq('transport_request_id', trC2.id);
    await supabase.from('security_deposits').delete().eq('transport_request_id', trC2.id);
    await supabase.from('transport_requests').delete().eq('id', trC2.id);
    await supabase.from('foster_assignments').delete().eq('id', newAssignment.id);
    await supabase.from('foster_volunteer_applications').delete().eq('id', newApp.id);
    
    if (isTempPet) {
      console.log('Deleting temporary test pet...');
      await supabase.from('pets').delete().eq('id', petId);
    } else {
      await supabase.from('pets').update({ status: 'AVAILABLE' }).eq('id', petId);
    }
    console.log('Clean up done.');
    
    console.log('\n=== E2E PROGRAMMATIC VERIFICATION COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\n=== E2E PROGRAMMATIC VERIFICATION FAILED ===');
    console.error(error);
  }
}

run();
