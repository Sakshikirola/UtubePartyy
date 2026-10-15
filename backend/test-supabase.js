   require("dotenv").config();
   const url = process.env.SUPABASE_URL;
   const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

   console.log("URL:", JSON.stringify(url));
   console.log("KEY length:", key && key.length);

   fetch(url + "/rest/v1/rooms?select=id&limit=1", { headers: { apikey: key } })
     .then(async (r) => console.log(r.status, await r.text()))
     .catch((e) => console.log("fetch failed:", e.message));