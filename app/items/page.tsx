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
  qty?: number;
  shippingCost?: number;
  platformFee?: number;
  profit: number;
  platform?: string;
};

export default function ItemsPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!authReady) return;
    if (!uid) router.replace("/login");
  }, [authReady, uid, router]);

  useEffect(() => {
    if (!authReady || !uid) return;

    const q = query(
      collection(db, "items"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [authReady, uid]);

  const totalProfit = useMemo(
    () => items.reduce((s, i) => s + (i.profit || 0), 0),
    [items]
  );

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return null;

  return (
    <main className="container">
      <h1>Items</h1>
      <div className="muted">Total profit: {totalProfit.toLocaleString()}</div>

      <div className="stack" style={{ marginTop: 16 }}>
        {items.map(it => (
          <div key={it.id} className="card">
            <div className="row">
              <div>
                <strong>{it.name}</strong>
                <div className="muted">
                  Qty: {it.qty ?? 1} · Ship: {(it.shippingCost ?? 0).toLocaleString()} · Fees: {(it.platformFee ?? 0).toLocaleString()}
                </div>
              </div>

              <div className="row">
                <div style={{ fontWeight: 900 }}>
                  {it.profit >= 0 ? "+" : ""}
                  {it.profit.toLocaleString()}
                </div>

                <a href={`/items/${it.id}/edit`}>
                  <button>Edit</button>
                </a>

                <button
                  className="danger"
                  onClick={() => deleteDoc(doc(db, "items", it.id))}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <a href="/items/new"><button className="primary">+ Add item</button></a>
        <button
          className="danger"
          style={{ marginLeft: 8 }}
          onClick={async () => {
            await signOut(auth);
            router.replace("/login");
          }}
        >
          Log out
        </button>
      </div>
    </main>
  );
}
