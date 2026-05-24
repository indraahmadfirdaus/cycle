import { NextResponse } from "next/server";
import { todayKey } from "@/lib/cycle";
import { getAuthenticatedSupabase } from "@/lib/api/auth";

export async function GET() {
  const auth = await getAuthenticatedSupabase();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("ai_insights")
    .select("*")
    .eq("user_id", user.id)
    .eq("insight_date", todayKey())
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    insight:
      data ?? {
        insight_date: todayKey(),
        content: "Log today's mood and symptoms to generate a more personal Cycle insight.",
        phase: null
      }
  });
}
