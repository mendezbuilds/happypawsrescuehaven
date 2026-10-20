import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvqqyiykvyvjnkwczcwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cXF5aXlrdnl2am5rd2N6Y3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDMxMTksImV4cCI6MjA5NzMxOTExOX0.jwwwtSTLaVJaFs8ECA58aOn1VR1KUCb5UKSwm-odDdY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Attempting test insert into contact_submissions WITHOUT .select()...");
  const testPayload = {
    full_name: 'Test Submitter',
    email: 'test@example.com',
    phone: '123-456-7890',
    subject: 'General Inquiry',
    message: 'This is a test message to inspect table columns.'
  };

  const { data, error } = await supabase
    .from('contact_submissions')
    .insert([testPayload]);

  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Insert succeeded! Result (should be null since no .select() was used):", data);
  }
}

run().catch(console.error);
