import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "@/lib/api/auth";

type PushSubscriptionBody = {
  subscription?: Record<string, unknown>;
  events?: Record<string, boolean>;
  deliveryTime?: string;
};

export async function POST(request: Request) {
  const auth = await getAuthenticatedSupabase();
  if (auth.error) return auth.error;

  const body = (await request.json()) as PushSubscriptionBody;
  if (!body.subscription) {
    return NextResponse.json({ error: "Push subscription payload is required." }, { status: 400 });
  }

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        subscription: body.subscription,
        events: body.events ?? {},
        delivery_time: body.deliveryTime ?? "09:00"
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ subscription: data });
}
