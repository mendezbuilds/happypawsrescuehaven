// supabase/functions/geocode-address/index.ts
//
// Geocodes an address string using the Geocodio API (US/Canada)
// with a global fallback to OpenStreetMap's Nominatim API for international routes.
//
// Expects a POST body like:
// {
//   "address": "Lagos, Nigeria"
// }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEOCODIO_API_KEY = Deno.env.get("GEOCODIO_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Global Nominatim Geocoding Function (OSM)
async function geocodeNominatim(address: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    console.log(`Querying Nominatim for: ${address}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Rescue4pawsTransport/1.0 (transport@rescue4paws.org)"
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || data.length === 0) return null;

    const first = data[0];
    return {
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
      formattedAddress: first.display_name,
      state: null,
    };
  } catch (err) {
    console.error("Nominatim geocoding error:", err);
    return null;
  }
}

// Geocodio Geocoding Function (US/Canada only)
async function geocodeGeocodio(address: string) {
  try {
    if (!GEOCODIO_API_KEY) return null;
    const geocodioUrl = `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(address)}&api_key=${GEOCODIO_API_KEY}`;
    console.log(`Querying Geocodio for: ${address}`);
    const response = await fetch(geocodioUrl);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;

    const firstResult = data.results[0];
    const { lat, lng } = firstResult.location;
    const formattedAddress = firstResult.formatted_address;
    const stateCode = firstResult.address_components?.state || null;

    return {
      latitude: lat,
      longitude: lng,
      formattedAddress,
      state: stateCode,
    };
  } catch (err) {
    console.error("Geocodio geocoding error:", err);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { address } = await req.json();

    if (!address || typeof address !== 'string' || !address.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing required field: address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine if the query looks international (contains non-US indicators or does not look like US format)
    const isInternational = /nigeria|lagos|london|uk|united kingdom|germany|france|europe|africa|asia|australia|india/i.test(address) ||
                            (!/usa|united states|us|canada|ca/i.test(address) && !/\b[A-Z]{2}\b\s+\d{5}/.test(address));

    let result = null;

    if (isInternational) {
      // 1. Try Nominatim first for international
      result = await geocodeNominatim(address);
      // Fallback to Geocodio if Nominatim failed
      if (!result) {
        result = await geocodeGeocodio(address);
      }
    } else {
      // 2. Try Geocodio first for US/Canada
      result = await geocodeGeocodio(address);
      // Fallback to Nominatim if Geocodio failed
      if (!result) {
        result = await geocodeNominatim(address);
      }
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: `Address could not be geocoded: '${address}'. Please check spelling or enter a more specific address.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("geocode-address function error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error occurred during geocoding." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
