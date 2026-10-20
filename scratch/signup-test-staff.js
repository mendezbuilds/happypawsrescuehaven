import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvqqyiykvyvjnkwczcwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cXF5aXlrdnl2am5rd2N6Y3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDMxMTksImV4cCI6MjA5NzMxOTExOX0.jwwwtSTLaVJaFs8ECA58aOn1VR1KUCb5UKSwm-odDdY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Signing up test-staff@happypawsrescuehaven.com...");
  const { data, error } = await supabase.auth.signUp({
    email: 'test-staff@happypawsrescuehaven.com',
    password: 'Password123!',
    options: {
      data: {
        full_name: 'Test Staff Member'
      }
    }
  });

  if (error) {
    console.error("Sign up failed (if already exists, we will check next):", error.message);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test-staff@happypawsrescuehaven.com',
      password: 'Password123!'
    });
    if (signInError) {
      console.error("Sign in failed too:", signInError.message);
    } else {
      console.log("Sign in succeeded. User ID:", signInData.user.id);
    }
  } else {
    console.log("Sign up succeeded! User:", data.user);
    console.log("User ID:", data.user?.id);
  }
}

run().catch(console.error);
