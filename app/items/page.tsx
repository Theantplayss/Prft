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
const [lastDeleted, setLastDeleted] = useState<any | null>(null);
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
  async function onDelete(it: any) {
  if (!confirm("Delete this item?")) return;

  // Save it for undo
  setLastDeleted({ ...it });

  // Delete from Firestore
  await deleteDoc(doc(db, "items", it.id));

  // Clear undo after 5 seconds
  setTimeout(() => {
    setLastDeleted(null);
  }, 5000);
}

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return null;

  return (
    <main className="container">
      <h1>Items</h1>
      <div
  style={{
    fontWeight: 800,
    color: totalProfit >= 0 ? "#35d07f" : "#ff6b6b",
  }}
>
  Total profit: {totalProfit >= 0 ? "+" : ""}
  {totalProfit.toLocaleString()}
</div>


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
                <div
  style={{
    fontWeight: 900,
    fontSize: 18,
    color: (it.profit || 0) >= 0 ? "#35d07f" : "#ff6b6b",
  }}
>
  {(it.profit || 0) >= 0 ? "+" : ""}
  {(it.profit || 0).toLocaleString()}
</div>


                <a href={`/items/${it.id}/edit`}>
                  <button>Edit</button>
                </a>
<button
  className="danger"
  onClick={() => {
    if (!confirm("Delete this item? This can only be undone for 5 Seconds.")) return;
    deleteDoc(doc(db, "items", it.id));
  }}
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
