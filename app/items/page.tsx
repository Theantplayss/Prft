"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, deleteDoc, doc, onSnapshot, query, where, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

type Item = {
  id: string;
  name: string;
  buy: number;
  sell: number;
  qty: number;
  shippingCost: number;
  platformFee: number;
  extraFees?: number; // ✅ NEW
  platform: string;
  profit: number;

};

export default function ItemsPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [lastDeleted, setLastDeleted] = useState<Item | null>(null);

  useEffect(() => {
    if (!authReady || !uid) return;

    const q = query(collection(db, "items"), where("uid", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    });

    return unsub;
  }, [authReady, uid]);

  async function onDelete(it: Item) {
    if (!confirm("Delete this item?")) return;

    setLastDeleted(it);
    await deleteDoc(doc(db, "items", it.id));

    setTimeout(() => setLastDeleted(null), 5000);
  }

  const totalProfit = useMemo(
    () => items.reduce((sum, it) => sum + (it.profit || 0), 0),
    [items]
  );

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return null;

  return (
    <main className="container hero">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>Items</h1>
        <button className="primary" onClick={() => router.push("/items/new")}>
          Add item
        </button>
      </div>

      <div
        style={{
          fontWeight: 900,
          marginBottom: 16,
          color: totalProfit >= 0 ? "#35d07f" : "#ff6b6b",
        }}
      >
        Total profit: {totalProfit >= 0 ? "+" : ""}
        {totalProfit.toLocaleString()}
      </div>

      <div className="stack">
        {items.map((it) => (
          <div key={it.id} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{it.name}</strong>

              <div
                style={{
                  fontWeight: 900,
                  color: it.profit >= 0 ? "#35d07f" : "#ff6b6b",
                }}
              >
                {it.profit >= 0 ? "+" : ""}
                {it.profit.toLocaleString()}
              </div>
            </div>

            <div className="muted">
              Buy: {it.buy} · Sell: {it.sell} · Qty: {it.qty}
            </div>

            <div className="muted">
              Ship: {it.shippingCost} · Fee: {it.platformFee}
              {it.extraFees ? ` · Extra: ${it.extraFees}` : ""} {/* ✅ NEW */}
            </div>

            <div className="muted">Platform: {it.platform}</div>

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button onClick={() => router.push(`/items/${it.id}/edit`)}>
                Edit
              </button>
              <button className="danger" onClick={() => onDelete(it)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {lastDeleted && (
        <div
          className="card"
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <span className="muted">Item deleted</span>
          <button
            onClick={async () => {
              const { id, ...data } = lastDeleted;
              await addDoc(collection(db, "items"), data);
              setLastDeleted(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
    </main>
  );
}
