import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/api/auth";

function createPartnerCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(5)))
    .map((value) => (value % 36).toString(36).toUpperCase())
    .join("");
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedSupabase();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const origin = new URL(request.url).origin;
  const partnerCode = createPartnerCode();

  const { data, error } = await supabase
    .from("partner_pairs")
    .insert({
      primary_user_id: user.id,
      invite_token: partnerCode,
      status: "pending",
      visibility_settings: { phase: true, period_date: true, mood: true, symptoms: false }
    })
    .select("id, invite_token, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    pair: data,
    partnerCode,
    shareUrl: `${origin}/auth?partnerCode=${partnerCode}`
  });
}
