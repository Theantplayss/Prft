"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, leave login
  useEffect(() => {
    if (!authReady) return;
    if (uid) router.replace("/dashboard");
  }, [authReady, uid, router]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.code ? `${e.code}: ${e.message}` : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container hero">
      <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>PRFT — Log in</h1>

        <form onSubmit={onLogin} className="stack">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button disabled={loading} type="submit">
            {loading ? "Signing in..." : "Log in"}
          </button>

          {err && <div className="muted">{err}</div>}
        </form>

        <div style={{ height: 12 }} />

        <a href="/signup">
          <button type="button">Need an account? Sign up</button>
        </a>
      </div>
    </main>
  );
}
