"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

type Item = {
  id: string;
  name?: string;

  // money fields (from your older version)
  buy?: number;
  sell?: number;
  shippingCost?: number;
  platformFee?: number;
  extraFees?: number;
  qty?: number;

  // derived/stored profit (you already have this)
  profit?: number;

  status?: "listed" | "sold";

  // split
  partnerName?: string;
  yourSplitPct?: number;
};

export default function ItemsPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<"all" | "listed" | "sold">("all");

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

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return null;

  return (
    <main className="container hero">
      {/* Header */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Items</h1>
        <button onClick={() => router.push("/dashboard")}>Home</button>
      </div>

      <div style={{ height: 12 }} />

      {/* Total sold profit */}
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

      {/* Filters + Add */}
      <div className="row" style={{ gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("listed")}>Listed</button>
        <button onClick={() => setFilter("sold")}>Sold</button>

        <div style={{ flex: 1 }} />

        <button className="primary" onClick={() => router.push("/items/new")}>
          + Add item
        </button>
      </div>

      {/* Items list */}
      <div className="stack">
        {filteredItems.length === 0 ? (
          <div className="muted">No items found.</div>
        ) : (
          filteredItems.map((it) => {
            const status = (it.status ?? "listed") as "listed" | "sold";

            const buy = Number(it.buy || 0);
            const sell = Number(it.sell || 0);
            const shipping = Number(it.shippingCost || 0);
            const platform = Number(it.platformFee || 0);
            const extra = Number(it.extraFees || 0);
            const qty = Number(it.qty || 1);

            const net = Number(it.profit || 0);

            const yourPct = it.yourSplitPct ?? 100;
            const yourCut = net * (yourPct / 100);
            const partnerName = (it.partnerName ?? "").trim();

            return (
              <div key={it.id} className="card">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{it.name || "Untitled"}</div>
                    <div className="muted">
                      Status: <strong>{status}</strong>
                      {qty !== 1 ? <> · Qty: <strong>{qty}</strong></> : null}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900 }}>
                      Net: {net >= 0 ? "+" : ""}
                      {net.toLocaleString()}
                    </div>

                    {yourPct < 100 && (
                      <div className="muted">
                        Your cut ({yourPct}%{partnerName ? ` w/ ${partnerName}` : ""}):{" "}
                        {yourCut >= 0 ? "+" : ""}
                        {yourCut.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ height: 10 }} />

                {/* Fee breakdown (this is what you’re missing) */}
                <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
                  <div className="muted">Buy: {buy.toLocaleString()}</div>
                  <div className="muted">Sell: {sell.toLocaleString()}</div>
                  <div className="muted">Shipping: {shipping.toLocaleString()}</div>
                  <div className="muted">Platform: {platform.toLocaleString()}</div>
                  <div className="muted">Extra: {extra.toLocaleString()}</div>
                </div>

                <div style={{ height: 12 }} />

                <div className="row" style={{ gap: 8 }}>
                  <button onClick={() => router.push(`/items/${it.id}/edit`)}>Edit</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
