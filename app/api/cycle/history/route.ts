import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/api/auth";

export async function GET() {
  const auth = await getAuthenticatedSupabase();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const [cycles, daily, rhythm] = await Promise.all([
    supabase.from("cycle_logs").select("*").eq("user_id", user.id).order("period_start", { ascending: false }),
    supabase.from("daily_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(90),
    supabase.from("rhythm_logs").select("*").eq("user_id", user.id).order("log_date", { ascending: false }).limit(90)
  ]);

  const error = cycles.error ?? daily.error ?? rhythm.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    cycleLogs: cycles.data ?? [],
    dailyLogs: daily.data ?? [],
    rhythmLogs: rhythm.data ?? []
  });
}
