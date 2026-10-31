// supabase/functions/send-approval-email/index.ts
//
// Sends adoption-related emails to adopters via Resend. Supports eight
// email types:
// - 'application_approved': sent when staff approves an application,
//   directs the adopter to the checkout page to submit adoption payment.
// - 'adoption_finalized': sent when staff approves the adoption fee
//   payment proof, directs the adopter to the transport page to choose
//   self-pickup or transport.
// - 'deposit_requested': sent after staff approves a transport fee
//   proof, directs the adopter back to the transport request page to
//   submit the refundable security deposit.
// - 'payment_confirmed': sent when staff approves the security deposit,
//   confirms transport is finalized and shares the tracking ID.
// - 'donation_confirmed': sent when staff confirms a donation proof,
//   thanks the donor.
// - 'foster_assignment_notice': sent when staff assigns a pet to an
//   approved foster, links to the foster coordination page.
// - 'foster_deposit_requested': sent to an out-of-state foster once
//   their location/quote is confirmed, asking for the refundable
//   security deposit.
// - 'foster_payment_confirmed': sent once a foster's deposit is
//   confirmed (or waived for Michigan fosters), shares tracking ID.
//
// Expects a POST body like:
// {
//   "type": "application_approved" | "adoption_finalized" | "deposit_requested" | "payment_confirmed" | "donation_confirmed" | "foster_assignment_notice" | "foster_deposit_requested" | "foster_payment_confirmed",
//   "adopterEmail": "jane@example.com",     // for donation_confirmed, this is the DONOR's email; for foster types, the FOSTER's email
//   "adopterName": "Jane Doe",              // same pattern — donor/foster name depending on type
//   "petName": "Luna",                      // NOT required for donation_confirmed
//   "applicationId": "uuid-here",           // required for application_approved
//   "adoptionId": "uuid-here",              // required for adoption_finalized
//   "transportRequestId": "uuid-here",      // required for deposit_requested
//   "trackingId": "TRK-2026-0001",          // required for payment_confirmed and foster_payment_confirmed
//   "donationAmount": "50.00",              // required for donation_confirmed
//   "assignmentId": "uuid-here"              // required for foster_assignment_notice and foster_deposit_requested
// }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CONTACT_NOTIFICATION_EMAIL = Deno.env.get("CONTACT_NOTIFICATION_EMAIL") ?? "admin@rescue4pawz.site";
const EMAIL_DOMAIN = Deno.env.get("EMAIL_DOMAIN") ?? "rescue4pawz.site";
const SITE_URL = Deno.env.get("SITE_URL") ?? (
  Deno.env.get("ENVIRONMENT") === "development"
    ? "http://localhost:5173"
    : "https://rescue4pawz.site"
);
const TRANSPORT_SITE_URL = Deno.env.get("TRANSPORT_SITE_URL") ?? (
  SITE_URL.includes("localhost")
    ? "http://localhost:5174"
    : "https://ship.rescue4pawz.site"
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const body = await req.json();
    const type = body.type ?? "application_approved"; // default for backward compatibility
    const { adopterEmail, adopterName, petName, applicationId, adoptionId, transportRequestId, trackingId, donationAmount, assignmentId, submitterName, submitterEmail, message, subject: contactSubject, phone: contactPhone } = body;

    // contact_form_submission uses different field names (submitterName/submitterEmail) — skip the adopter guard
    if (type !== "contact_form_submission") {
      // petName is NOT required for donation_confirmed (donations aren't pet-specific)
      if (!adopterEmail || !adopterName || (type !== "donation_confirmed" && !petName)) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: adopterEmail, adopterName, and petName (except for donation_confirmed)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let subject: string;
    let emailHtml: string;
    let fromAddress = `Rescue4paws <adoption@${EMAIL_DOMAIN}>`;

    if (type === "shipment_fee_approved") {
      if (!transportRequestId) {
        return new Response(
          JSON.stringify({ error: "Missing required field for shipment_fee_approved: transportRequestId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      fromAddress = `Rescue4paws Transport <transport@${EMAIL_DOMAIN}>`;
      subject = `One more step for your shipment: ${petName}`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F8FAFC; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #0F172A;">Hello, ${adopterName}!</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            We've received and confirmed your transport fee payment for <strong>${petName}</strong>.
            The last step before we can schedule transport is a refundable security deposit of <strong>$${donationAmount}</strong>.
          </p>
          <a href="${TRANSPORT_SITE_URL}/ship?resume=${transportRequestId}" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; font-size: 14px;">
            Submit Security Deposit
          </a>
          <p style="font-size: 13px; color: #64748B; margin-top: 32px; line-height: 1.5;">
            This deposit is fully refundable and helps us ensure safe delivery. Once it's confirmed, your shipment will be dispatched and you'll receive real-time tracking updates.
          </p>
          <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
            Warmly,<br/>
            <strong>Rescue4paws Transport Team</strong>
          </p>
        </div>
      `;
    } else if (type === "shipment_finalized") {
      if (!trackingId) {
        return new Response(
          JSON.stringify({ error: "Missing required field for shipment_finalized: trackingId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      fromAddress = `Rescue4paws Transport <transport@${EMAIL_DOMAIN}>`;
      subject = `Your shipment has been dispatched! 🎉`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F8FAFC; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #0F172A;">Wonderful news, ${adopterName}!</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Everything is confirmed for your shipment of <strong>${petName}</strong>. Your payment and security deposit proofs have been verified.
          </p>
          <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #4F46E5; margin: 0 0 8px; font-weight: bold;">
              Your Tracking Number
            </p>
            <p style="font-size: 22px; font-family: monospace; font-weight: bold; color: #4F46E5; margin: 0;">
              ${trackingId}
            </p>
          </div>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            You can now track the live status and journey timeline of your shipment.
          </p>
          <a href="${TRANSPORT_SITE_URL}/track/${trackingId}" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; font-size: 14px;">
            Track Shipment Live
          </a>
          <p style="font-size: 13px; color: #64748B; margin-top: 32px;">
            If you have any questions, just reply to this email. Thank you for choosing Rescue4paws!
          </p>
          <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
            Warmly,<br/>
            <strong>Rescue4paws Transport Team</strong>
          </p>
        </div>
      `;
    } else if (type === "foster_assignment_notice") {
      if (!assignmentId) {
        return new Response(
          JSON.stringify({ error: "Missing required field for foster_assignment_notice: assignmentId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fromAddress = `Rescue4paws Foster <foster@${EMAIL_DOMAIN}>`;
      const fosterUrl = `${SITE_URL}/foster/location/${assignmentId}`;
      subject = `You've been matched with ${petName}! 🐾`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F8FAFC; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #0F172A;">Great news, ${adopterName}!</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            You've been matched as a foster for <strong>${petName}</strong>! We're so grateful for your dedication to rescuing animals in need.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Next, let us know how you'd like to receive ${petName} — pick them up yourself, or have us arrange transport for you.
          </p>
          <a href="${fosterUrl}" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; font-size: 14px;">
            Coordinate Pickup or Transport
          </a>
          <p style="font-size: 13px; color: #64748B; margin-top: 32px;">
            If you have any questions, simply reply to this email — we're always happy to help.
          </p>
          <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
            Warmly,<br/>
            <strong>Rescue4paws Care Team</strong>
          </p>
        </div>
      `;
    } else if (type === "foster_deposit_requested") {
      if (!assignmentId) {
        return new Response(
          JSON.stringify({ error: "Missing required field for foster_deposit_requested: assignmentId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fromAddress = `Rescue4paws Foster <foster@${EMAIL_DOMAIN}>`;
      const fosterUrl = `${SITE_URL}/foster/location/${assignmentId}`;
      subject = `One more step before ${petName} comes home with you`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F8FAFC; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #0F172A;">Almost there, ${adopterName}!</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Since you're outside Michigan, the final step before we can arrange transport for
            <strong>${petName}</strong> is a fully refundable security deposit.
          </p>
          <a href="${fosterUrl}" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; font-size: 14px;">
            Submit Security Deposit
          </a>
          <p style="font-size: 13px; color: #64748B; margin-top: 32px; line-height: 1.5;">
            This deposit is 100% refundable and helps us ensure a smooth foster placement. Once it's confirmed, you'll receive your tracking ID right away.
          </p>
          <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
            Warmly,<br/>
            <strong>Rescue4paws Care Team</strong>
          </p>
        </div>
      `;
    } else if (type === "foster_payment_confirmed") {
      if (!trackingId) {
        return new Response(
          JSON.stringify({ error: "Missing required field for foster_payment_confirmed: trackingId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fromAddress = `Rescue4paws Foster <foster@${EMAIL_DOMAIN}>`;
      subject = `${petName} is on the way to you! 🎉`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F8FAFC; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #0F172A;">Wonderful, ${adopterName}!</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Everything is confirmed for <strong>${petName}'s</strong> foster placement with you.
            Thank you for opening your home and heart!
          </p>
          <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #4F46E5; margin: 0 0 8px; font-weight: bold;">
              Your Transport Tracking ID
            </p>
            <p style="font-size: 22px; font-family: monospace; font-weight: bold; color: #4F46E5; margin: 0;">
              ${trackingId}
            </p>
          </div>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Use this ID to follow ${petName}'s journey. Our team will be in touch with pickup and delivery details.
          </p>
          <p style="font-size: 13px; color: #64748B; margin-top: 32px;">
            If you have any questions, just reply to this email — we're happy to help.
          </p>
          <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
            Warmly,<br/>
            <strong>Rescue4paws Care Team</strong>
          </p>
        </div>
      `;
    } else if (type === "donation_confirmed") {
      if (!donationAmount) {
        return new Response(
          JSON.stringify({ error: "Missing required field for donation_confirmed: donationAmount" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fromAddress = `Rescue4paws <donation@${EMAIL_DOMAIN}>`;
      subject = `Thank you for your generous donation! 🐾`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F8FAFC; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #0F172A;">Thank you, ${adopterName}!</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Your donation of <strong>$${donationAmount}</strong> has been confirmed. Gifts like yours directly support vulnerable animals in our care — from emergency medical surgeries to foster supplies and safe transport.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            On behalf of every companion we rescue and rehabilitate, thank you for being a vital part of this mission.
          </p>
          <p style="font-size: 13px; color: #64748B; margin-top: 32px;">
            If you have any questions about your tax-deductible donation, just reply to this email.
          </p>
          <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
            With deep gratitude,<br/>
            <strong>Rescue4paws Foundation</strong>
          </p>
        </div>
      `;
    } else if (type === "payment_confirmed") {
      if (!trackingId) {
        return new Response(
          JSON.stringify({ error: "Missing required field for payment_confirmed: trackingId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fromAddress = `Rescue4paws Transport <transport@${EMAIL_DOMAIN}>`;
      subject = `${petName}'s adoption is finalized! 🎉`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F8FAFC; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #0F172A;">Congratulations, ${adopterName}!</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Your payment has been confirmed and <strong>${petName}'s</strong> adoption is now officially finalized. Welcome to the Rescue4paws family!
          </p>
          <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #4F46E5; margin: 0 0 8px; font-weight: bold;">
              Your Transport Tracking ID
            </p>
            <p style="font-size: 22px; font-family: monospace; font-weight: bold; color: #4F46E5; margin: 0;">
              ${trackingId}
            </p>
          </div>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Use this ID to follow ${petName}'s transport progress. Our coordination team will be in touch soon with pickup and transport details.
          </p>
          <p style="font-size: 13px; color: #64748B; margin-top: 32px;">
            If you have any questions, just reply to this email — we're happy to help.
          </p>
          <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
            Warmly,<br/>
            <strong>Rescue4paws Team</strong>
          </p>
        </div>
      `;
    } else if (type === "deposit_requested") {
      if (!transportRequestId) {
        return new Response(
          JSON.stringify({ error: "Missing required field for deposit_requested: transportRequestId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fromAddress = `Rescue4paws Transport <transport@${EMAIL_DOMAIN}>`;
      const transportUrl = `${SITE_URL}/transport/request/${transportRequestId}`;
      subject = `One more step for ${petName}'s journey home`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F8FAFC; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #0F172A;">Great progress, ${adopterName}!</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            We've received and confirmed your transport fee payment for <strong>${petName}</strong>. The last step before we can schedule transport is a refundable security deposit.
          </p>
          <a href="${transportUrl}" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; font-size: 14px;">
            Submit Security Deposit
          </a>
          <p style="font-size: 13px; color: #64748B; margin-top: 32px; line-height: 1.5;">
            This deposit is fully refundable and helps us ensure a smooth handoff. Once it's confirmed, you'll receive your tracking ID right away.
          </p>
          <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
            Warmly,<br/>
            <strong>Rescue4paws Team</strong>
          </p>
        </div>
      `;
    } else if (type === "adoption_finalized") {
      if (!adoptionId) {
        return new Response(
          JSON.stringify({ error: "Missing required field for adoption_finalized: adoptionId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const transportChoiceUrl = `${SITE_URL}/transport/request/${adoptionId}`;
      subject = `${petName}'s adoption fee is confirmed — next step inside`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F8FAFC; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #0F172A;">Wonderful news, ${adopterName}!</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            We've confirmed your adoption fee payment for <strong>${petName}</strong>. The adoption itself is finalized — now let's get ${petName} safely home.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Let us know how you'd like to proceed: pick ${petName} up yourself, or have us arrange transport for you.
          </p>
          <a href="${transportChoiceUrl}" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; font-size: 14px;">
            Choose Pickup or Transport
          </a>
          <p style="font-size: 13px; color: #64748B; margin-top: 32px;">
            If you have any questions, just reply to this email — we're happy to help.
          </p>
          <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
            Warmly,<br/>
            <strong>Rescue4paws Team</strong>
          </p>
        </div>
      `;
    } else if (type === "contact_form_submission") {
      if (!submitterName || !submitterEmail || !message) {
        return new Response(
          JSON.stringify({ error: "Missing required fields for contact_form_submission: submitterName, submitterEmail, message" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fromAddress = `Rescue4paws Admin <admin@${EMAIL_DOMAIN}>`;
      subject = `[Contact Form] ${contactSubject ?? "General Inquiry"} — from ${submitterName}`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F8FAFC; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 4px; color: #0F172A;">New Contact Form Submission</h1>
          <p style="font-size: 12px; color: #64748B; margin-top: 0;">Received via ${EMAIL_DOMAIN}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 14px;">
            <tr>
              <td style="padding: 10px 14px; background-color: #EEF2FF; font-weight: bold; width: 30%; border: 1px solid #E2E8F0; color: #3730A3;">Name</td>
              <td style="padding: 10px 14px; border: 1px solid #E2E8F0; color: #1E293B;">${submitterName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; background-color: #EEF2FF; font-weight: bold; border: 1px solid #E2E8F0; color: #3730A3;">Email</td>
              <td style="padding: 10px 14px; border: 1px solid #E2E8F0;"><a href="mailto:${submitterEmail}" style="color: #4F46E5; font-weight: 600;">${submitterEmail}</a></td>
            </tr>
            ${contactPhone ? `
            <tr>
              <td style="padding: 10px 14px; background-color: #EEF2FF; font-weight: bold; border: 1px solid #E2E8F0; color: #3730A3;">Phone</td>
              <td style="padding: 10px 14px; border: 1px solid #E2E8F0; color: #1E293B;">${contactPhone}</td>
            </tr>` : ""}
            <tr>
              <td style="padding: 10px 14px; background-color: #EEF2FF; font-weight: bold; border: 1px solid #E2E8F0; color: #3730A3;">Subject</td>
              <td style="padding: 10px 14px; border: 1px solid #E2E8F0; color: #1E293B;">${contactSubject ?? "General Inquiry"}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding: 18px 20px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px;">
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; margin: 0 0 10px; font-weight: bold;">Message</p>
            <p style="font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap; color: #334155;">${message}</p>
          </div>
          <p style="font-size: 12px; color: #64748B; margin-top: 28px;">
            Reply directly to this email to respond to ${submitterName}.
          </p>
        </div>
      `;

      // For contact form: send TO internal staff, reply-to the submitter
      const resendContactResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [CONTACT_NOTIFICATION_EMAIL],
          reply_to: submitterEmail,
          subject,
          html: emailHtml,
        }),
      });

      const resendContactData = await resendContactResponse.json();

      if (!resendContactResponse.ok) {
        console.error("Resend API error (contact form):", resendContactData);
        return new Response(
          JSON.stringify({ error: "Failed to send contact notification email", details: resendContactData }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, emailId: resendContactData.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // type === 'application_approved'
      if (!applicationId) {
        return new Response(
          JSON.stringify({ error: "Missing required field for application_approved: applicationId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const checkoutUrl = `${SITE_URL}/checkout/${applicationId}`;
      subject = `Your application for ${petName} has been approved!`;
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #F8FAFC; color: #0F172A; border-radius: 12px; border: 1px solid #E2E8F0;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #0F172A;">Great news, ${adopterName}!</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            Your application to adopt <strong>${petName}</strong> has been approved by our team.
            We're so excited to help you welcome ${petName} into your home and family.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">
            The next step is to complete the adoption fee payment to finalize the placement process.
          </p>
          <a href="${checkoutUrl}" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; font-size: 14px;">
            Complete Adoption Payment
          </a>
          <p style="font-size: 13px; color: #64748B; margin-top: 32px;">
            If you have any questions, just reply to this email — we're happy to help.
          </p>
          <p style="font-size: 14px; color: #64748B; margin-top: 24px;">
            Warmly,<br/>
            <strong>Rescue4paws Team</strong>
          </p>
        </div>
      `;
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [adopterEmail],
        subject,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-approval-email error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});