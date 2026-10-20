import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvqqyiykvyvjnkwczcwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cXF5aXlrdnl2am5rd2N6Y3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDMxMTksImV4cCI6MjA5NzMxOTExOX0.jwwwtSTLaVJaFs8ECA58aOn1VR1KUCb5UKSwm-odDdY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("--- 1. Testing Database Insertion ---");
  const testPayload = {
    full_name: 'Jane Tester',
    email: 'jane.tester@example.com',
    phone: '+1 (555) 555-5555',
    subject: 'Volunteer Inquiry',
    message: 'Hello, this is a programmatic integration test of the contact form submission.'
  };

  // Perform insert WITHOUT chaining .select()
  const { data, error: insertError } = await supabase
    .from('contact_submissions')
    .insert([testPayload]);

  if (insertError) {
    console.error("❌ Database insert failed:", insertError);
    process.exit(1);
  } else {
    console.log("✅ Database insert succeeded!");
  }

  console.log("\n--- 2. Testing Edge Function Invocation ---");
  const { data: functionData, error: functionError } = await supabase.functions.invoke('send-approval-email', {
    body: {
      type: 'contact_form_submission',
      submitterName: testPayload.full_name,
      submitterEmail: testPayload.email,
      message: testPayload.message,
      subject: testPayload.subject,
      phone: testPayload.phone
    }
  });

  if (functionError) {
    console.error("❌ Edge function invocation failed:", functionError);
    process.exit(1);
  } else {
    console.log("✅ Edge function invocation succeeded!", functionData);
  }

  console.log("\n--- 3. Testing Optional Fields Handling ---");
  console.log("Invoking edge function with only required fields (no phone, no subject)...");
  const { data: optFunctionData, error: optFunctionError } = await supabase.functions.invoke('send-approval-email', {
    body: {
      type: 'contact_form_submission',
      submitterName: 'John Required-Only',
      submitterEmail: 'john.req@example.com',
      message: 'Hello, this is a message with only required fields.'
    }
  });

  if (optFunctionError) {
    console.error("❌ Edge function invocation (required fields only) failed:", optFunctionError);
    process.exit(1);
  } else {
    console.log("✅ Edge function invocation (required fields only) succeeded!", optFunctionData);
  }

  console.log("\n🎉 All integration tests passed successfully!");
}

run().catch(console.error);
