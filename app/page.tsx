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
      <div className="card" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>Prft</div>
          <div className="row" style={{ gap: 8 }}>
            <button onClick={() => router.push("/login")}>Log in</button>
            <button className="primary" onClick={() => router.push("/login")}>
              Sign up
            </button>
          </div>
        </div>

        <div style={{ height: 18 }} />

        <h1 style={{ margin: 0, fontSize: 36, lineHeight: 1.1 }}>
          Track flips. Know your profit.
        </h1>
        <p className="muted" style={{ fontSize: 16, marginTop: 10 }}>
          Add items, estimate fees, mark sold vs listed, and see accurate totals.
        </p>

        <div style={{ height: 16 }} />

        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button className="primary" onClick={() => router.push("/login")}>
            Get started
          </button>
          <button onClick={() => router.push("/login")}>Log in</button>
        </div>

        <div style={{ height: 18 }} />

        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <div className="card" style={{ minWidth: 240, flex: 1 }}>
            <div style={{ fontWeight: 900 }}>Sold vs Listed</div>
            <div className="muted">Totals only count sold items.</div>
          </div>
          <div className="card" style={{ minWidth: 240, flex: 1 }}>
            <div style={{ fontWeight: 900 }}>Fees included</div>
            <div className="muted">Shipping, platform, and extra fees.</div>
          </div>
          <div className="card" style={{ minWidth: 240, flex: 1 }}>
            <div style={{ fontWeight: 900 }}>Quick workflow</div>
            <div className="muted">Add → edit → mark sold → done.</div>
          </div>
        </div>
      </div>
    </main>
  );
}

function DashboardHome({ uid }: { uid: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const q = query(collection(db, "items"), where("uid", "==", uid));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [uid]);

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

export default function HomePage() {
  const { authReady, uid } = useAuth();

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return <PublicHome />;
  return <DashboardHome uid={uid} />;
}
