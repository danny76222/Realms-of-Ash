import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PixelButton } from "@/components/game/ui";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In: Realm of Ash" },
      {
        name: "description",
        content:
          "Sign in to Realm of Ash to keep your campaign save slots in the cloud across devices.",
      },
      { property: "og:title", content: "Sign In: Realm of Ash" },
      { property: "og:description", content: "Cloud save slots for your Realm of Ash campaign." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void navigate({ to: "/" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    const fn =
      mode === "in"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    if (error) setMsg(error.message);
    else if (mode === "up")
      setMsg("Account created. Check your email if confirmation is required, then sign in.");
    else void navigate({ to: "/" });
    setBusy(false);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="pixel-font mb-4 text-center text-lg text-primary">Realm of Ash</h1>
      <Panel title={mode === "in" ? "Sign In" : "Create an Account"}>
        <p className="mb-3 text-sm text-muted-foreground">
          Cloud saves are optional. The game plays fine as a guest, but signing in keeps your slots
          across devices.
        </p>
        <div className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            aria-label="Email"
            className="w-full border-2 border-border bg-input px-2 py-2 text-foreground outline-none focus:border-primary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            aria-label="Password"
            className="w-full border-2 border-border bg-input px-2 py-2 text-foreground outline-none focus:border-primary"
          />
          <PixelButton
            className="w-full"
            disabled={busy || !email || !password}
            onClick={() => void submit()}
          >
            {mode === "in" ? "Sign In" : "Sign Up"}
          </PixelButton>
          <PixelButton
            className="w-full"
            variant="ghost"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
          >
            {mode === "in" ? "Need an account?" : "Have an account?"}
          </PixelButton>
          <a
            href="/"
            className="pixel-font block pt-1 text-center text-[10px] uppercase text-muted-foreground underline"
          >
            Play as guest
          </a>
        </div>
        {msg ? <p className="mt-2 text-sm text-destructive">{msg}</p> : null}
      </Panel>
    </main>
  );
}
