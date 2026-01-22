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

export default function DashboardPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();
  const [items, setItems] = useState<Item[]>([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authReady) return;
    if (!uid) router.replace("/login");
  }, [authReady, uid, router]);

  // Load items
  useEffect(() => {
    if (!authReady || !uid) return;

    const q = query(collection(db, "items"), where("uid", "==", uid));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [authReady, uid]);

  const stats = useMemo(() => {
    const sold = items.filter((i) => (i.status ?? "listed") === "sold");
    const listed = items.filter((i) => (i.status ?? "listed") === "listed");

    return {
      soldProfit: sold.reduce((s, i) => s + Number(i.profit || 0), 0),
      soldCount: sold.length,
      listedCount: listed.length,
      listedPotential: listed.reduce((s, i) => s + Number(i.profit || 0), 0),
    };
  }, [items]);

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return null;

  return (
    <main
      className="container hero"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 45%)",
      }}
    >
      {/* Header */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <button
          className="danger"
          onClick={async () => {
            await signOut(auth);
            router.replace("/login");
          }}
        >
          Log out
        </button>
      </div>

      <div style={{ height: 12 }} />

      {/* Actions */}
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <button className="primary" onClick={() => router.push("/items/new")}>
          + Add item
        </button>
        <button onClick={() => router.push("/items")}>View items</button>
      </div>

      <div style={{ height: 18 }} />

      {/* ===== DASHBOARD GRID (FIX #1) ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* LEFT: STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          <div className="card">
            <div className="muted">Total sold profit</div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: stats.soldProfit >= 0 ? "#35d07f" : "#ff6b6b",
              }}
            >
              {stats.soldProfit >= 0 ? "+" : ""}
              {stats.soldProfit.toLocaleString()}
            </div>
          </div>

          <div className="card">
            <div className="muted">Sold items</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>
              {stats.soldCount}
            </div>
          </div>

          <div className="card">
            <div className="muted">Listed items</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>
              {stats.listedCount}
            </div>
          </div>

          <div className="card">
            <div className="muted">Potential profit</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>
              {stats.listedPotential >= 0 ? "+" : ""}
              {stats.listedPotential.toLocaleString()}
            </div>
          </div>
        </div>

        {/* RIGHT: RECENT ITEMS */}
        <div className="card" style={{ minHeight: 260 }}>
          <div
            className="row"
            style={{ justifyContent: "space-between", marginBottom: 10 }}
          >
            <strong>Recent items</strong>
            <button onClick={() => router.push("/items")}>Open</button>
          </div>

          {items.length === 0 ? (
            <div className="muted">No items yet.</div>
          ) : (
            <div className="stack">
              {items.slice(0, 6).map((it) => {
                const profit = Number(it.profit || 0);
                return (
                  <div
                    key={it.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{it.name ?? "Untitled"}</div>
                      <div className="muted">Status: {it.status ?? "listed"}</div>
                    </div>
                    <div
                      style={{
                        fontWeight: 900,
                        color: profit >= 0 ? "#35d07f" : "#ff6b6b",
                      }}
                    >
                      {profit >= 0 ? "+" : ""}
                      {profit.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
