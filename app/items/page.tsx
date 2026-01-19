"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, deleteDoc, doc, onSnapshot, query, where, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

type Item = {
  id: string;
  name: string;
  profit: number;
  status: "listed" | "sold";
};

export default function ItemsPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!authReady || !uid) return;
    return onSnapshot(
      query(collection(db, "items"), where("uid", "==", uid)),
      (snap) => setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    );
  }, [authReady, uid]);

  const totalProfit = useMemo(
    () => items.filter(i => i.status === "sold").reduce((s, i) => s + i.profit, 0),
    [items]
  );

  if (!authReady || !uid) return null;

  return (
    <main className="container hero">
      <h1>Items</h1>

      <div style={{ fontWeight: 900, color: totalProfit >= 0 ? "#35d07f" : "#ff6b6b" }}>
        Total sold profit: {totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString()}
      </div>

      {items.map(it => (
        <div key={it.id} className="card">
          <strong>{it.name}</strong>
          <div className="muted">Status: {it.status}</div>
          <div style={{ color: it.profit >= 0 ? "#35d07f" : "#ff6b6b" }}>
            {it.profit >= 0 ? "+" : ""}{it.profit.toLocaleString()}
          </div>
        </div>
      ))}
    </main>
  );
}
