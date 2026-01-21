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

export default function HomePage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();

  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!authReady) return;
    if (!uid) router.replace("/login");
  }, [authReady, uid, router]);

  useEffect(() => {
    if (!authReady || !uid) return;

    const q = query(collection(db, "items"), where("uid", "==", uid));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [authReady, uid]);

  const stats = useMemo(() => {
    const sold = items.filter((it) => (it.status ?? "listed") === "sold");
    const listed = items.filter((it) => (it.status ?? "listed") === "listed");

    const soldProfit = sold.reduce((sum, it) => sum + Number(it.profit || 0), 0);
    const listedPotential = listed.reduce((sum, it) => sum + Number(it.profit || 0), 0);

    return {
      soldCount: sold.length,
      listedCount: listed.length,
      soldProfit,
      listedPotential,
    };
  }, [items]);

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return null;

  return (
    <main className="container hero">
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

      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <button className="primary" onClick={() => router.push("/items/new")}>
          + Add item
        </button>
        <button onClick={() => router.push("/items")}>View items</button>
      </div>

      <div style={{ height: 18 }} />

      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div className="card" style={{ minWidth: 220 }}>
          <div className="muted">Total sold profit</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: stats.soldProfit >= 0 ? "#35d07f" : "#ff6b6b",
            }}
          >
            {stats.soldProfit >= 0 ? "+" : ""}
            {stats.soldProfit.toLocaleString()}
          </div>
        </div>

        <div className="card" style={{ minWidth: 220 }}>
          <div className="muted">Sold items</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{stats.soldCount.toLocaleString()}</div>
        </div>

        <div className="card" style={{ minWidth: 220 }}>
          <div className="muted">Listed items</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>{stats.listedCount.toLocaleString()}</div>
        </div>

        <div className="card" style={{ minWidth: 220 }}>
          <div className="muted">Potential profit (listed)</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>
            {stats.listedPotential >= 0 ? "+" : ""}
            {stats.listedPotential.toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <strong>Recent items</strong>
          <button onClick={() => router.push("/items")}>Open</button>
        </div>

        <div style={{ height: 10 }} />

        {items.length === 0 ? (
          <div className="muted">No items yet. Add your first one.</div>
        ) : (
          <div className="stack">
            {items.slice(0, 5).map((it) => {
              const status = it.status ?? "listed";
              const profit = Number(it.profit || 0);
              return (
                <div key={it.id} className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{it.name ?? "Untitled"}</div>
                    <div className="muted">Status: {status}</div>
                  </div>
                  <div style={{ fontWeight: 900, color: profit >= 0 ? "#35d07f" : "#ff6b6b" }}>
                    {profit >= 0 ? "+" : ""}
                    {profit.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
