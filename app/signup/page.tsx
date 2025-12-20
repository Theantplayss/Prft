"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", cred.user.uid), {
        email: cred.user.email,
        plan: "free",
        createdAt: serverTimestamp(),
      });

      router.push("/");
    } catch (e: any) {
      setErr(e?.message ?? "Signup failed");
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 420 }}>
      <h1>Prft — Sign up</h1>
      <form onSubmit={onSignup} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          placeholder="Password (6+ chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Create account</button>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
    </main>
  );
}
