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
  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      setUid(u?.uid ?? null);
    });
    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!uid) return;
    const q = query(
  collection(db, "items"),
  where("uid", "==", uid),
  orderBy("createdAt", "desc")
);



    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      );
    });

    return () => unsub();
  }, [uid]);

  const totalProfit = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.profit) || 0), 0),
    [items]
  );

  return (
    <main style={{ padding: 40, maxWidth: 700 }}>
      <h1>Items</h1>
      <p>Total profit: <strong>{totalProfit}</strong></p>

      <p style={{ marginTop: 12 }}>
        <a href="/items/new">+ Add item</a> · <a href="/">Home</a>
      </p>

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        {items.length === 0 ? (
          <p>No items yet.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} style={{ border: "1px solid #333", padding: 12, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{it.name}</strong>
                <Link href={`/items/${it.id}/edit`}>Edit</Link>
                <button onClick={() => onDelete(it.id)}>
  Delete
</button>
                <span>Profit: {it.profit}</span>
              </div>
              <div style={{ opacity: 0.8 }}>
                Buy: {it.buy} · Sell: {it.sell} · {it.platform ?? "—"}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
async function onDelete(itemId: string) {
  const ok = confirm("Delete this item?");
  if (!ok) return;

  await deleteDoc(doc(db, "items", itemId));
}
