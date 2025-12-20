"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where, orderBy, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  name: string;
  buy: number;
  sell: number;
  profit: number;
  platform?: string;
};

export default function ItemsPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);


useEffect(() => {
  const unsub = onAuthStateChanged(auth, (u) => {
    setUid(u?.uid ?? null);
    setAuthReady(true);
  });
  return () => unsub();
}, []);

useEffect(() => {
  if (!authReady) return;
  if (!uid) router.push("/login");
}, [authReady, uid, router]);

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
return (
  <main className="container">
    <div className="stack">
      <div className="row">
        <div>
          <h1 style={{ margin: 0 }}>Items</h1>
          <div className="muted">Total profit: {totalProfit}</div>
        </div>

        <div className="row">
          <a href="/items/new">+ Add item</a>
          <a href="/">Home</a>
        </div>
      </div>

      <div className="stack">
        {items.length === 0 ? (
          <p>No items yet.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="card">
              <div className="row">
                <div>
                  <div style={{ fontWeight: 800 }}>{it.name}</div>
                  <div className="muted">{it.platform ?? "-"}</div>
                </div>

                <div className="row">
                  <div style={{ fontWeight: 900 }}>
                    {it.profit >= 0 ? "+" : ""}
                    {it.profit}
                  </div>

                  <a href={`/items/${it.id}/edit`}>
                    <button>Edit</button>
                  </a>

                  <button onClick={() => onDelete(it.id)}>Delete</button>
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

async function onDelete(itemId: string) {
  const ok = confirm("Delete this item?");
  if (!ok) return;

  await deleteDoc(doc(db, "items", itemId));
}
}