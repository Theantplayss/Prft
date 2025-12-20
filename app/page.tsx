"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>Prft</h1>
      <p>Track your reselling profit.</p>

      {user ? (
        <>
          <p>Logged in as <strong>{user.email}</strong></p>
          <button onClick={() => signOut(auth)}>Logout</button>
        <p style={{ marginTop: 12 }}>
  <a href="/items">Go to items</a> · <a href="/items/new">Add item</a>
</p>
</>
      ) : (
        <p>
          <a href="/signup">Sign up</a> · <a href="/login">Login</a>
        </p>
      )}
    </main>
  );
}
