"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

const PLATFORM_FEES: Record<string, number> = {
  ebay: 0.1325,
  goat: 0.12,
  stockx: 0.125,
  facebook: 0.05,
  offerup: 0.129,
};

function estimateShipping(sell: string) {
  const s = Number(sell || 0);
  if (s >= 300) return 25;
  if (s >= 150) return 15;
  if (s >= 80) return 10;
  return 6;
}

function estimatePlatformFee(platform: string, sell: string) {
  const s = Number(sell || 0);
  return Math.round(s * (PLATFORM_FEES[platform] ?? 0));
}

export default function NewItemPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();

  const [name, setName] = useState("");
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");
  const [qty, setQty] = useState("1");
  const [shippingCost, setShippingCost] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [extraFees, setExtraFees] = useState("");
  const [platform, setPlatform] = useState("ebay");

  const [status, setStatus] = useState<"listed" | "sold">("listed"); // ✅ NEW

  const [shippingTouched, setShippingTouched] = useState(false);
  const [feeTouched, setFeeTouched] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!uid) router.replace("/login");
  }, [authReady, uid, router]);

  useEffect(() => {
    if (!sell) return;
    if (!shippingTouched) setShippingCost(String(estimateShipping(sell)));
    if (!feeTouched) setPlatformFee(String(estimatePlatformFee(platform, sell)));
  }, [sell, platform, shippingTouched, feeTouched]);

  const profit = useMemo(() => {
    const b = Number(buy || 0);
    const s = Number(sell || 0);
    const q = Number(qty || 1);
    const ship = Number(shippingCost || 0);
    const fee = Number(platformFee || 0);
    const extra = Number(extraFees || 0);
    return (s - b) * q - ship - fee - extra;
  }, [buy, sell, qty, shippingCost, platformFee, extraFees]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;

    await addDoc(collection(db, "items"), {
      uid,
      name: name.trim(),
      buy: Number(buy),
      sell: Number(sell),
      qty: Number(qty || 1),
      shippingCost: Number(shippingCost || 0),
      platformFee: Number(platformFee || 0),
      extraFees: Number(extraFees || 0),
      platform,
      status, // ✅ NEW
      profit,
      createdAt: serverTimestamp(),
    });

    router.replace("/items");
  }

  if (!authReady || !uid) return null;

  return (
    <main className="container hero">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1>Add item</h1>

        <form onSubmit={onSave} className="stack">
          <input placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Buy price" inputMode="decimal" value={buy} onChange={(e) => setBuy(e.target.value)} />
          <input placeholder="Sell price" inputMode="decimal" value={sell} onChange={(e) => setSell(e.target.value)} />

          <label className="muted">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="listed">Listed</option>
            <option value="sold">Sold</option>
          </select>

          <label className="muted">Quantity</label>
          <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />

          <label className="muted">Shipping</label>
          <input value={shippingCost} onChange={(e) => { setShippingTouched(true); setShippingCost(e.target.value); }} />

          <label className="muted">Platform fee</label>
          <input value={platformFee} onChange={(e) => { setFeeTouched(true); setPlatformFee(e.target.value); }} />

          <label className="muted">Extra fees</label>
          <input value={extraFees} onChange={(e) => setExtraFees(e.target.value)} />

          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="ebay">eBay</option>
            <option value="goat">GOAT</option>
            <option value="stockx">StockX</option>
            <option value="facebook">Facebook</option>
            <option value="offerup">OfferUp</option>
          </select>

          <div style={{ fontWeight: 900, color: profit >= 0 ? "#35d07f" : "#ff6b6b" }}>
            Profit: {profit >= 0 ? "+" : ""}{profit.toLocaleString()}
          </div>

          <button className="primary">Save item</button>
        </form>
      </div>
    </main>
  );
}
