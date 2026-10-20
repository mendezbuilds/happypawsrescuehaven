import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvqqyiykvyvjnkwczcwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cXF5aXlrdnl2am5rd2N6Y3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDMxMTksImV4cCI6MjA5NzMxOTExOX0.jwwwtSTLaVJaFs8ECA58aOn1VR1KUCb5UKSwm-odDdY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("--- 1. Testing Anonymous Donation Insert (without .select()) ---");
  const testDonation = {
    donor_name: 'Test Donor',
    donor_email: 'donor@example.com',
    amount: 150.00,
    currency: 'USD',
    message: 'Test donation dedication note.',
    proof_image_url: 'donations/test-proof-receipt.png',
    status: 'PENDING_REVIEW'
  };

  const { error: insertError } = await supabase
    .from('donations')
    .insert([testDonation]);

  if (insertError) {
    console.error("❌ Anonymous insert failed:", insertError);
    process.exit(1);
  } else {
    console.log("✅ Anonymous insert succeeded!");
  }

  console.log("\n--- 2. Verifying Anonymous SELECT Restriction ---");
  const { data: selectData, error: selectError } = await supabase
    .from('donations')
    .select('*')
    .eq('donor_email', 'donor@example.com');

  if (selectError) {
    console.log("✅ Anonymous select correctly blocked or errored:", selectError.message);
  } else if (selectData && selectData.length > 0) {
    console.log("⚠️ WARNING: Anonymous select succeeded and returned data. Verify if RLS SELECT policy is configured to allow this or if it was expected to be private. Returned rows:", selectData.length);
  } else {
    console.log("✅ Anonymous select returned empty result (no error, but rows hidden by RLS SELECT policy).");
  }
}

run().catch(console.error);
