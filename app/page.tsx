"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

type Item = {
  id: string;
  name?: string;
  profit?: number;
  status?: "listed" | "sold";
};

function PublicHome() {
  const router = useRouter();

  return (
    <main className="container hero">
      <div
        className="card"
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: 28,
          background: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(255,255,255,0.04))",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: 0.2 }}>Prft</div>

          <div className="row" style={{ gap: 8 }}>
            <button onClick={() => router.push("/login")}>Log in</button>
            <button className="primary" onClick={() => router.push("/login")}>
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
            Add items, auto-estimate fees, mark <strong>sold vs listed</strong>, and keep totals accurate.
          </p>

          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <button className="primary" onClick={() => router.push("/login")}>
              Get started
            </button>
            <button onClick={() => router.push("/login")}>See dashboard</button>
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
            <div className="muted">Shipping, platform fees, promo/extra fees.</div>
          </div>

          <div className="card" style={{ minWidth: 260, flex: 1, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ fontWeight: 900 }}>Fast workflow</div>
            <div className="muted">Add → edit → mark sold → done.</div>
          </div>
        </div>

        <div style={{ height: 18 }} />

        <div className="card" style={{ background: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>How it works</div>
          <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 220, flex: 1 }}>
              <div style={{ fontWeight: 900 }}>1) Add an item</div>
              <div className="muted">Buy, sell, platform, qty, fees.</div>
            </div>
            <div style={{ minWidth: 220, flex: 1 }}>
              <div style={{ fontWeight: 900 }}>2) Track status</div>
              <div className="muted">Listed items don’t inflate totals.</div>
            </div>
            <div style={{ minWidth: 220, flex: 1 }}>
              <div style={{ fontWeight: 900 }}>3) Mark sold</div>
              <div className="muted">Totals update instantly.</div>
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div className="muted" style={{ fontSize: 13, textAlign: "center" }}>
          Built for resellers who want clean, accurate numbers.
        </div>
      </div>
    </main>
  );
}
export default function Page() {
  return <div />;
}
