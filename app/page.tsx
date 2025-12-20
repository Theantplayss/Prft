"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

export default function HomePage() {
  const { authReady, uid } = useAuth();

  return (
    <main className="container hero">
      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ marginTop: 0, fontSize: 28, letterSpacing: -0.5 }}>PRFT</h1>
        <div className="muted">Track your flips. Know your profit.</div>

        <div style={{ height: 16 }} />

        {!authReady ? (
          <div className="muted">Loading…</div>
        ) : uid ? (
          <div className="stack">
            <div className="row" style={{ justifyContent: "flex-start" }}>
              <a href="/items"><button>Open dashboard</button></a>
              <a href="/items/new"><button className="primary">+ Add item</button></a>
            </div>

            <button
              className="danger"
              onClick={async () => {
                await signOut(auth);
                window.location.href = "/";
              }}
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="row" style={{ justifyContent: "flex-start" }}>
            <a href="/signup"><button className="primary">Sign up</button></a>
            <a href="/login"><button>Log in</button></a>
          </div>
        )}
      </div>
    </main>
  );
}

