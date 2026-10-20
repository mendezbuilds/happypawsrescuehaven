const supabaseUrl = 'https://kvqqyiykvyvjnkwczcwu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cXF5aXlrdnl2am5rd2N6Y3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDMxMTksImV4cCI6MjA5NzMxOTExOX0.jwwwtSTLaVJaFs8ECA58aOn1VR1KUCb5UKSwm-odDdY';

async function run() {
  const res = await fetch(supabaseUrl + '/rest/v1/', {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': 'Bearer ' + supabaseAnonKey
    }
  });
  const data = await res.json();
  if (data.components?.schemas) {
    const schemas = data.components.schemas;
    console.log("=== foster_volunteer_applications ===");
    console.log(JSON.stringify(schemas.foster_volunteer_applications, null, 2));
    
    console.log("\n=== foster_assignments ===");
    console.log(JSON.stringify(schemas.foster_assignments, null, 2));
    
    console.log("\n=== transport_requests ===");
    console.log(JSON.stringify(schemas.transport_requests, null, 2));
  } else {
    console.log("No schemas found.");
  }
}

run().catch(console.error);
