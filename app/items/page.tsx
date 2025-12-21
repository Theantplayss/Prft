"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

type Item = {
  id: string;
  name: string;
  buy: number;
  sell: number;
  profit: number;
  platform?: string;
  uid?: string;
  createdAt?: any;
};

export default function ItemsPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();

  const [items, setItems] = useState<Item[]>([]);

  // Protect page (only AFTER authReady)
  useEffect(() => {
    if (!authReady) return;
    if (!uid) router.replace("/login");
  }, [authReady, uid, router]);

  // Firestore listener (only when authed)
  useEffect(() => {
    if (!authReady || !uid) return;

    const q = query(
      collection(db, "items"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    return () => unsub();
  }, [authReady, uid]);

  const totalProfit = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.profit) || 0), 0),
    [items]
  );

  async function onDelete(id: string) {
    await deleteDoc(doc(db, "items", id));
  }

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return null; // redirecting

  return (
    <main className="container">
      <div className="stack">
        <div className="row">
          <div>
            <h1 style={{ margin: 0 }}>Items</h1>
            <div className="muted">Total profit: {totalProfit}</div>
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <a href="/items/new"><button className="primary">+ Add item</button></a>
            <a href="/"><button>Home</button></a>
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
        </div>

        <div className="stack">
          {items.length === 0 ? (
            <div className="card muted">No items yet. Click “Add item”.</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="card">
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 800 }}>{it.name}</div>
                    <div className="muted">{it.platform ?? "-"}</div>
                  </div>
<div className="row" style={{ justifyContent: "flex-end" }}>
  <div
    style={{
      fontWeight: 900,
      fontSize: 18,
      color: (Number(it.profit) || 0) >= 0 ? "#35d07f" : "#ff6b6b",
    }}
  >
    {(Number(it.profit) || 0) >= 0 ? "+" : ""}
    {it.profit}
  </div>

  <a href={`/items/${it.id}/edit`}>
    <button>Edit</button>
  </a>

  <button className="danger" onClick={() => onDelete(it.id)}>
    Delete
  </button>
</div>
                </div>

                <div className="muted" style={{ marginTop: 10 }}>
                  Buy: {it.buy} · Sell: {it.sell}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
