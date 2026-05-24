import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/api/auth";

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedSupabase();
  if (auth.error) return auth.error;

  const { visibility } = (await request.json()) as { visibility?: Record<string, boolean> };
  if (!visibility) return NextResponse.json({ error: "Visibility settings are required." }, { status: 400 });

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("partner_pairs")
    .update({ visibility_settings: visibility })
    .eq("primary_user_id", user.id)
    .in("status", ["pending", "active"])
    .select("id, status, visibility_settings")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ pair: data });
}
