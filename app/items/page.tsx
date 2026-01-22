

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  setDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";

import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

type Item = {
  id: string;
  uid?: string;

  name?: string;
  status?: "listed" | "sold";

  // your existing fields
  qty?: number;
  shippingCost?: number; // "Ship"
  platformFee?: number;  // "Fee"
  extraFees?: number;    // "Extra"
  platform?: string;     // "Platform: ebay"
  profit?: number;       // net profit (already stored in your app)

  // splits
  partnerName?: string;  // "Rusy"
  yourSplitPct?: number; // 70, default 100
};

export default function ItemsPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<"all" | "listed" | "sold">("all");

  // Undo delete
  const [lastDeleted, setLastDeleted] = useState<{
    id: string;
    data: any;
  } | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authReady) return;
    if (!uid) router.replace("/login");
  }, [authReady, uid, router]);

  // Load items
  useEffect(() => {
    if (!authReady || !uid) return;

    const q = query(collection(db, "items"), where("uid", "==", uid));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [authReady, uid]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((it) => (it.status ?? "listed") === filter);
  }, [items, filter]);

  const totalSoldProfit = useMemo(() => {
    return items
      .filter((it) => (it.status ?? "listed") === "sold")
      .reduce((sum, it) => sum + Number(it.profit || 0), 0);
  }, [items]);

  const yourSoldProfit = useMemo(() => {
    return items
      .filter((it) => (it.status ?? "listed") === "sold")
      .reduce((sum, it) => {
        const net = Number(it.profit || 0);
        const pct = it.yourSplitPct ?? 100;
        return sum + net * (pct / 100);
      }, 0);
  }, [items]);

  async function onToggleStatus(it: Item) {
    const next: "listed" | "sold" = (it.status ?? "listed") === "sold" ? "listed" : "sold";
    await updateDoc(doc(db, "items", it.id), { status: next });
  }

  async function onDelete(it: Item) {
    if (!confirm("Delete this item?")) return;

    // Save for undo (store raw data except id)
    const { id, ...rest } = it as any;
    setLastDeleted({ id, data: rest });

    await deleteDoc(doc(db, "items", it.id));

    // Clear undo after 6 seconds
    setTimeout(() => setLastDeleted(null), 6000);
  }

  async function onUndoDelete() {
    if (!lastDeleted) return;
    // Restore the document with the same ID
    await setDoc(doc(db, "items", lastDeleted.id), lastDeleted.data);
    setLastDeleted(null);
  }

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return null;

  return (
    <main className="container hero">
      {/* Top bar */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="row" style={{ gap: 10 }}>
          <button onClick={() => router.back()}>Back</button>
          <button onClick={() => router.push("/dashboard")}>Home</button>
        </div>

        <div className="row" style={{ gap: 10 }}>
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

      <div style={{ height: 14 }} />

      <div style={{ fontSize: 22, fontWeight: 900 }}>Items</div>

      <div style={{ height: 6 }} />

      {/* Totals */}
      <div
        style={{
          fontWeight: 900,
          fontSize: 22,
          color: totalSoldProfit >= 0 ? "#35d07f" : "#ff6b6b",
        }}
      >
        Total sold profit: {totalSoldProfit >= 0 ? "+" : ""}
        {totalSoldProfit.toLocaleString()}
      </div>

      <div className="muted" style={{ marginTop: 6 }}>
        Your sold profit: {yourSoldProfit >= 0 ? "+" : ""}
        {yourSoldProfit.toFixed(2)}
      </div>

      {/* Undo banner */}
      {lastDeleted && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>Deleted.</strong> You can undo for a few seconds.
            </div>
            <button onClick={onUndoDelete}>Undo</button>
          </div>
        </div>
      )}

      <div style={{ height: 14 }} />

      {/* Filters (spaced like your screenshot) */}
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("listed")}>Listed</button>
        <button onClick={() => setFilter("sold")}>Sold</button>
      </div>

      {/* List */}
      <div className="stack">
        {filteredItems.map((it) => {
          const status = (it.status ?? "listed") as "listed" | "sold";
          const qty = Number(it.qty || 1);
          const ship = Number(it.shippingCost || 0);
          const fee = Number(it.platformFee || 0);
          const extra = Number(it.extraFees || 0);
          const platform = (it.platform || "").trim();

          const net = Number(it.profit || 0);

          const yourPct = it.yourSplitPct ?? 100;
          const yourCut = net * (yourPct / 100);
          const partnerName = (it.partnerName ?? "").trim();
          const partnerCut = net - yourCut;

          return (
            <div key={it.id} className="card">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.05 }}>
                    {it.name || "Untitled"}
                  </div>

                  <div className="muted" style={{ marginTop: 6, fontSize: 22 }}>
                    Status: <strong>{status}</strong>
                  </div>

                  <div className="muted" style={{ marginTop: 16, fontSize: 20 }}>
                    Qty: {qty} · Ship: {ship} · Fee: {fee} · Extra: {extra}
                  </div>

                  <div className="muted" style={{ marginTop: 10, fontSize: 20 }}>
                    Platform: {platform || "—"}
                  </div>

                  {/* Split display (added) */}
                  {yourPct < 100 && (
                    <div className="muted" style={{ marginTop: 10, fontSize: 18 }}>
                      Split: You {yourPct}%{partnerName ? ` / ${partnerName} ${100 - yourPct}%` : ` / Partner ${100 - yourPct}%`}
                      {" · "}
                      Your cut: {yourCut >= 0 ? "+" : ""}
                      {yourCut.toFixed(2)}
                      {" · "}
                      {partnerName ? `${partnerName}` : "Partner"}: {partnerCut >= 0 ? "+" : ""}
                      {partnerCut.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Profit on right */}
                <div style={{ fontSize: 28, fontWeight: 900, color: net >= 0 ? "#35d07f" : "#ff6b6b" }}>
                  {net >= 0 ? "+" : ""}
                  {net.toLocaleString()}
                </div>
              </div>

              <div style={{ height: 18 }} />

              <div className="row" style={{ justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => onToggleStatus(it)}>
                  {status === "sold" ? "Mark listed" : "Mark sold"}
                </button>
                <button onClick={() => router.push(`/items/${it.id}/edit`)}>Edit</button>
                <button className="danger" onClick={() => onDelete(it)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
