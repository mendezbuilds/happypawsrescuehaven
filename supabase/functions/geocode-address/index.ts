const MAPBOX_ACCESS_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    if (!MAPBOX_ACCESS_TOKEN) {
      console.error("MAPBOX_ACCESS_TOKEN secret is missing.");

      return new Response(
        JSON.stringify({ error: "Geocoding service is not configured." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const address = body?.address;

    if (
      typeof address !== "string" ||
      !address.trim() ||
      address.trim().length > 256 ||
      address.includes(";")
    ) {
      return new Response(
        JSON.stringify({
          error: "Please provide a valid address of up to 256 characters.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const buildUrl = (permanent: boolean) => {
      const query = new URLSearchParams({
        q: address.trim(),
        access_token: MAPBOX_ACCESS_TOKEN,
        limit: "1",
        autocomplete: "false",
      });
      if (permanent) {
        query.set("permanent", "true");
      }
      return `https://api.mapbox.com/search/geocode/v6/forward?${query.toString()}`;
    };

    let response = await fetch(buildUrl(true));

    // If permanent geocoding is not enabled or rate-limited on the Mapbox account,
    // seamlessly fall back to standard billable forward geocoding.
    if (!response.ok && (response.status === 429 || response.status === 403)) {
      response = await fetch(buildUrl(false));
    }

    if (!response.ok) {
      console.error("Mapbox geocoding failed. Status:", response.status);

      return new Response(
        JSON.stringify({
          error: "Address verification service failed. Please try again.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const feature = data?.features?.[0];

    if (!feature?.geometry?.coordinates) {
      return new Response(
        JSON.stringify({
          error: `Address could not be found: '${address}'. Please enter a more specific address.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [longitude, latitude] = feature.geometry.coordinates;
    const properties = feature.properties || {};
    const context = properties.context || {};

    const formattedAddress =
      properties.full_address ||
      [
        properties.name,
        properties.place_formatted,
      ].filter(Boolean).join(", ") ||
      address.trim();

    const state =
      context.region?.region_code ||
      context.region?.name ||
      null;

    const result = {
      latitude,
      longitude,
      formattedAddress,
      state,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Geocoding function error:", error);

    return new Response(
      JSON.stringify({ error: "An unexpected geocoding error occurred." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
