import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/api/auth";

export async function POST(request: Request) {
  const auth = await getAuthenticatedSupabase();
  if (auth.error) return auth.error;

  const { partnerCode } = (await request.json()) as { partnerCode?: string };
  if (!partnerCode) return NextResponse.json({ error: "Partner code is required." }, { status: 400 });

  const { supabase, user } = auth;
  const token = partnerCode.toUpperCase();

  const { data, error } = await supabase
    .from("partner_pairs")
    .update({
      partner_user_id: user.id,
      status: "active",
      connected_at: new Date().toISOString(),
    })
    .eq("invite_token", token)
    .eq("status", "pending")
    .is("partner_user_id", null)
    .neq("primary_user_id", user.id)
    .select("id, status, visibility_settings");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "That care code was not found, has expired, or you cannot connect to your own code." },
      { status: 404 },
    );
  }

  return NextResponse.json({ pair: data[0] });
}
