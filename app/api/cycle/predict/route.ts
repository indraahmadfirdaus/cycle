import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/api/auth";
import { predictCycle } from "@/lib/cycle";

export async function GET() {
  const auth = await getAuthenticatedSupabase();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("cycle_logs")
    .select("id, period_start, period_end")
    .eq("user_id", user.id)
    .order("period_start", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    prediction: predictCycle(
      (data ?? []).map((log) => ({
        id: log.id,
        periodStart: log.period_start,
        periodEnd: log.period_end ?? undefined
      }))
    )
  });
}
