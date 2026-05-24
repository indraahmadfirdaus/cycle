"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const isConfigured = useMemo(
    () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    []
  );

  async function submit() {
    setLoading(true);
    setStatus("");

    try {
      const supabase = createClient();
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { data: { display_name: displayName || email.split("@")[0] } }
            });

      if (result.error) {
        setStatus(result.error.message);
        return;
      }

      if (result.data.session) {
        router.replace("/");
        router.refresh();
        return;
      }

      setStatus(mode === "signin" ? "Welcome back. Opening Cycle..." : "Please check your inbox when you have a moment.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "We could not sign you in just yet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 text-charcoal">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-5xl items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] bg-petal/80 p-6 shadow-soft sm:p-8">
          <Link href="/" className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/70 px-4 font-semibold">
            <ArrowLeft size={18} aria-hidden="true" />
            Back
          </Link>
          <div className="max-w-md">
            <div className="mb-5 grid h-14 w-14 place-items-center rounded-3xl bg-rose text-white">
              <Heart aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Care for your cycle, gently.</h1>
            <p className="mt-4 text-lg leading-relaxed text-charcoal/72">
              Keep your period notes, feelings, questions, and partner sharing in one calm place.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <AuthBenefit icon={ShieldCheck} title="Yours first" text="You decide what stays private and what can be shared." />
            <AuthBenefit icon={Sparkles} title="Here with care" text="Ask questions without needing to explain everything again." />
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-soft backdrop-blur sm:p-7">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-blush/70 p-1">
            {(["signin", "signup"] as const).map((item) => (
              <button
                key={item}
                className={`min-h-11 rounded-xl font-semibold ${mode === item ? "bg-white text-berry shadow-sm" : "text-charcoal/62"}`}
                onClick={() => setMode(item)}
              >
                {item === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {!isConfigured && (
            <p className="mb-4 rounded-2xl bg-ovulation/70 p-3 text-sm">
              Sign-in keys are not ready yet. Ask the engineer to fill `.env.local` when it is time to connect accounts.
            </p>
          )}

          <div className="space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="text-sm font-semibold">Name</span>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-rose/20 bg-white px-4"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-semibold">Email</span>
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-rose/20 bg-white px-4"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Password</span>
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-rose/20 bg-white px-4"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          </div>

          <button
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-berry px-4 font-semibold text-white disabled:opacity-60"
            onClick={submit}
            disabled={loading || !email || !password}
          >
            <Mail size={18} aria-hidden="true" />
            {loading ? "One moment..." : mode === "signin" ? "Come in" : "Create my space"}
          </button>
          {status && <p className="mt-4 rounded-2xl bg-blush/80 p-3 text-sm">{status}</p>}
        </section>
      </div>
    </main>
  );
}

function AuthBenefit({
  icon: Icon,
  title,
  text
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-white/62 p-4">
      <Icon size={20} aria-hidden="true" />
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-charcoal/66">{text}</p>
    </div>
  );
}
