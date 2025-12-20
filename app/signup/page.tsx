"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

export default function SignupPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, leave signup
  useEffect(() => {
    if (!authReady) return;
    if (uid) router.replace("/items");
  }, [authReady, uid, router]);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // user profile doc (requires rules for /users/{uid})
      await setDoc(doc(db, "users", cred.user.uid), {
        email: cred.user.email,
        plan: "free",
        createdAt: serverTimestamp(),
      });

      router.replace("/items");
    } catch (e: any) {
      setErr(e?.code ? `${e.code}: ${e.message}` : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container hero">
      <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>PRFT — Sign up</h1>

        <form onSubmit={onSignup} className="stack">
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="Password (6+ chars)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="primary" disabled={loading} type="submit">
            {loading ? "Creating..." : "Create account"}
          </button>

          {err && <div className="muted">{err}</div>}
        </form>

        <div style={{ height: 12 }} />

        <a href="/login">
          <button type="button">Already have an account? Log in</button>
        </a>
      </div>
    </main>
  );
}
