"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  // Wait for firebase auth to initialize
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // If already logged in, leave signup page
  useEffect(() => {
    if (!authReady) return;
    if (uid) router.push("/items");
  }, [authReady, uid, router]);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // optional: create user profile doc
      await setDoc(doc(db, "users", cred.user.uid), {
        email: cred.user.email,
        plan: "free",
        createdAt: serverTimestamp(),
      });

      router.push("/items");
    } catch (e: any) {
      setErr(e?.code ? `${e.code}: ${e.message}` : "Signup failed");
    }
  }

  return (
    <main className="container">
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

          <button type="submit">Create account</button>

          {err && <div className="muted">{err}</div>}
        </form>

        <div style={{ height: 12 }} />

        <a href="/login">
          <button>Already have an account? Log in</button>
        </a>
      </div>
    </main>
  );
}
