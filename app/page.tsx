"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";

export default function Page() {
  const router = useRouter();
  const { authReady, uid } = useAuth();

  // If logged in, go straight to the app
  useEffect(() => {
    if (!authReady) return;
    if (uid) router.replace("/items");
  }, [authReady, uid, router]);

  if (!authReady) return <main className="container">Loading…</main>;
  if (uid) return <main className="container">Loading…</main>;

  // Public landing page (not logged in)
  return (
    <main className="container hero">
      <div
        className="card"
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: 28,
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(255,255,255,0.04))",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>Prft</div>
          <div className="row" style={{ gap: 8 }}>
            <button onClick={() => router.push("/login")}>Log in</button>
            <button className="primary" onClick={() => router.push("/signup")}>
              Sign up
            </button>
          </div>
        </div>

        <div style={{ height: 26 }} />

        <div style={{ maxWidth: 700 }}>
          <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1.05 }}>
            Track flips.
            <br />
            Know your profit.
          </h1>

          <div style={{ height: 10 }} />
          <div style={{ height: 3, width: 90, background: "#3b82f6", borderRadius: 999 }} />

          <p className="muted" style={{ fontSize: 16, marginTop: 14 }}>
            Add items, estimate fees, mark <strong>sold vs listed</strong>, and keep totals accurate.
          </p>

          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <button className="primary" onClick={() => router.push("/signup")}>
              Get started
            </button>
            <button onClick={() => router.push("/login")}>Log in</button>
          </div>
        </div>

        <div style={{ height: 22 }} />

        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <div className="card" style={{ minWidth: 260, flex: 1, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ fontWeight: 900 }}>Sold vs Listed</div>
            <div className="muted">Totals only count sold items.</div>
          </div>

          <div className="card" style={{ minWidth: 260, flex: 1, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ fontWeight: 900 }}>Fees included</div>
            <div className="muted">Shipping, platform, and extra fees.</div>
          </div>

          <div className="card" style={{ minWidth: 260, flex: 1, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ fontWeight: 900 }}>Fast workflow</div>
            <div className="muted">Add → edit → mark sold → done.</div>
          </div>
        </div>
      </div>
    </main>
  );
}
