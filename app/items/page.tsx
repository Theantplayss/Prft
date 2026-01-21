"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

type Item = {
  id: string;
  uid?: string;
  name?: string;

  buy?: number;
  sell?: number;
  qty?: number;

  shippingCost?: number;
  platformFee?: number;
  extraFees?: number;

  platform?: string;
  profit?: number;

  status?: "listed" | "sold"; // missing on older items
  createdAt?: any;
};

export default function ItemsPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [lastDeleted, setLastDeleted] = useState<Item | null>(null);
const [filter, setFilter] = useState<"all" | "listed" | "sold">("all");
const filteredItems = useMemo(() => {
  if (filter === "all") return items;
  return items.filter((it) => (it.status ?? "listed") === filter);
}, [items, filter]);

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
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [authReady, uid]);

  const totalSoldProfit = useMemo(() => {
    return items.reduce((sum, it) => {
      const status = (it.status ?? "listed") as "listed" | "sold";
      const p = Number(it.profit || 0);
      return status === "sold" ? sum + p : sum;
    }, 0);
  }, [items]);

  async function onDelete(it: Item) {
    if (!confirm("Delete this item?")) return;

    setLastDeleted({ ...it });
    await deleteDoc(doc(db, "items", it.id));
    setTimeout(() => setLastDeleted(null), 5000);
  }

  async function onUndo() {
    if (!lastDeleted) return;
    const { id, ...data } = lastDeleted;

    await addDoc(collection(db, "items"), {
      ...data,
      createdAt: serverTimestamp(),
    });

    setLastDeleted(null);
  }

  async function toggleStatus(it: Item) {
    const current = (it.status ?? "listed") as "listed" | "sold";
    const next = current === "sold" ? "listed" : "sold";
    await updateDoc(doc(db, "items", it.id), { status: next, updatedAt: serverTimestamp() });
  }

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return null;

  return (
    <main className="container">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" onClick={() => router.back()}>Back</button>
          <button type="button" onClick={() => router.push("/")}>Home</button>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <button className="primary" onClick={() => router.push("/items/new")}>
            + Add item
          </button>
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

      <h1 style={{ marginTop: 12 }}>Items</h1>

      <div
        style={{
          fontWeight: 900,
          marginBottom: 16,
          color: totalSoldProfit >= 0 ? "#35d07f" : "#ff6b6b",
        }}
      >
        Total sold profit: {totalSoldProfit >= 0 ? "+" : ""}
        {totalSoldProfit.toLocaleString()}
      </div>
<div className="row" style={{ gap: 8, marginBottom: 12 }}>
  <button onClick={() => setFilter("all")}>All</button>
  <button onClick={() => setFilter("listed")}>Listed</button>
  <button onClick={() => setFilter("sold")}>Sold</button>
</div>

      <div className="stack">
        {filteredItems.map((it) => {
          const status = (it.status ?? "listed") as "listed" | "sold";
          const profit = Number(it.profit || 0);

          return (
            <div key={it.id} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>
                    {it.name || "Untitled"}
                  </div>
                  <div className="muted">
                    Status: <strong>{status}</strong>
                  </div>
                </div>

                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 20,
                    color: profit >= 0 ? "#35d07f" : "#ff6b6b",
                  }}
                >
                  {profit >= 0 ? "+" : ""}
                  {profit.toLocaleString()}
                </div>
              </div>

              <div className="muted" style={{ marginTop: 8 }}>
                Qty: {it.qty ?? 1} · Ship: {(it.shippingCost ?? 0).toLocaleString()}
                · Fee: {(it.platformFee ?? 0).toLocaleString()}
                · Extra: {(it.extraFees ?? 0).toLocaleString()}
              </div>

              <div className="muted">Platform: {it.platform ?? "—"}</div>

              <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button onClick={() => toggleStatus(it)}>
                  {status === "sold" ? "Mark listed" : "Mark sold"}
                </button>

                <button onClick={() => router.push(`/items/${it.id}/edit`)}>
                  Edit
                </button>

                <button className="danger" onClick={() => onDelete(it)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
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
          <button onClick={onUndo}>Undo</button>
        </div>
      )}
    </main>
  );
}
