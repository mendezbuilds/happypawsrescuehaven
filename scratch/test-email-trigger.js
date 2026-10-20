import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvqqyiykvyvjnkwczcwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cXF5aXlrdnl2am5rd2N6Y3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDMxMTksImV4cCI6MjA5NzMxOTExOX0.jwwwtSTLaVJaFs8ECA58aOn1VR1KUCb5UKSwm-odDdY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("=== STARTING DONATION EMAIL TRIGGER INTEGRATION TEST ===");

  // 1. Sign in as the test staff user
  console.log("\n1. Authenticating as staff user...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test-staff@happypawsrescuehaven.com',
    password: 'Password123!'
  });

  if (authError) {
    console.error("❌ Authentication failed:", authError.message);
    process.exit(1);
  }
  console.log("✅ Authenticated successfully! User ID:", authData.user.id);

  // Set the authorization header on the client to act as the authenticated staff user
  const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`
      }
    }
  });

  // 2. Insert a temporary donation using anonymous client (representing a donor)
  console.log("\n2. Submitting test donation proof...");
  const testDonation = {
    donor_name: 'Donor Test One',
    donor_email: 'donortest@happypawsrescuehaven.com',
    amount: 50.00,
    currency: 'USD',
    message: 'Validating thank-you email invocation',
    proof_image_url: 'donations/test-receipt.pdf',
    status: 'PENDING_REVIEW'
  };

  const { error: insertError } = await supabase
    .from('donations')
    .insert([testDonation]);

  if (insertError) {
    console.error("❌ Donation submission failed:", insertError.message);
    process.exit(1);
  }
  console.log("✅ Donation proof submitted successfully!");

  // 3. Find the pending donation
  console.log("\n3. Retrieving pending donation as staff...");
  const { data: donations, error: fetchError } = await authenticatedClient
    .from('donations')
    .select('*')
    .eq('donor_email', 'donortest@happypawsrescuehaven.com')
    .eq('status', 'PENDING_REVIEW')
    .order('created_at', { ascending: false });

  if (fetchError || !donations || donations.length === 0) {
    console.error("❌ Failed to fetch pending donation:", fetchError ? fetchError.message : "Not found");
    process.exit(1);
  }
  
  const pendingDonation = donations[0];
  console.log(`... Pending donation found: ID: ${pendingDonation.id}, Donor: ${pendingDonation.donor_name}, Amount: $${pendingDonation.amount}`);

  // 4. Update the donation status to CONFIRMED
  console.log("\n4. Triaging status to CONFIRMED in database...");
  const { error: updateError } = await authenticatedClient
    .from('donations')
    .update({
      status: 'CONFIRMED',
      reviewed_by: authData.user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', pendingDonation.id);

  if (updateError) {
    console.error("❌ Status update failed:", updateError.message);
    process.exit(1);
  }
  console.log("✅ Donation status updated to CONFIRMED in database.");

  // 5. Invoke Edge Function 'send-approval-email' for 'donation_confirmed'
  console.log("\n5. Invoking send-approval-email Edge Function...");
  try {
    const { data: functionData, error: emailError } = await authenticatedClient.functions.invoke('send-approval-email', {
      body: {
        type: 'donation_confirmed',
        adopterEmail: pendingDonation.donor_email,
        adopterName: pendingDonation.donor_name,
        donationAmount: pendingDonation.amount.toFixed(2),
      }
    });

    if (emailError) {
      console.error("❌ Edge Function returned error:", emailError);
      process.exit(1);
    } else {
      console.log("✅ Edge Function invoked successfully! Response:", functionData);
    }
  } catch (err) {
    console.error("❌ Edge Function call threw an exception:", err);
    process.exit(1);
  }

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The donation flow and email trigger are verified.");
}

run().catch(console.error);
