import { supabaseAdmin } from "./src/db/index.js";

async function testConnection() {
  try {
    const { error } = await supabaseAdmin.from("tenants").select("*").limit(1);

    if (error) {
      throw error;
    }

    console.log("Supabase connection successful");
  } catch (err) {
    console.error("Supabase connection failed: ", err.message);
  }
}

testConnection();
