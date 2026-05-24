import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/api/auth";

type CycleLogBody = {
  type: "period" | "daily" | "rhythm";
  periodStart?: string;
  periodEnd?: string;
  date?: string;
  flow?: string;
  mood?: string;
  symptoms?: string[];
  notes?: string;
  energy?: number;
  sleep?: number;
};

export async function POST(request: Request) {
  const auth = await getAuthenticatedSupabase();
  if (auth.error) return auth.error;

  const body = (await request.json()) as CycleLogBody;
  const { supabase, user } = auth;

  if (body.type === "period") {
    const { data, error } = await supabase
      .from("cycle_logs")
      .insert({
        user_id: user.id,
        period_start: body.periodStart,
        period_end: body.periodEnd ?? null
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ cycleLog: data });
  }

  if (body.type === "daily") {
    const { data, error } = await supabase
      .from("daily_logs")
      .upsert(
        {
          user_id: user.id,
          log_date: body.date,
          flow_intensity: body.flow ?? "none",
          mood: body.mood,
          symptoms: body.symptoms ?? [],
          notes: body.notes ?? null
        },
        { onConflict: "user_id,log_date" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ dailyLog: data });
  }

  if (body.type === "rhythm") {
    const { data, error } = await supabase
      .from("rhythm_logs")
      .upsert(
        {
          user_id: user.id,
          log_date: body.date,
          energy_level: body.energy,
          sleep_quality: body.sleep,
          mood: body.mood,
          symptoms: body.symptoms ?? [],
          notes: body.notes ?? null
        },
        { onConflict: "user_id,log_date" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rhythmLog: data });
  }

  return NextResponse.json({ error: "Unsupported log type." }, { status: 400 });
}
