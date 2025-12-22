"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

/* ---- Platform fee averages ---- */
const PLATFORM_FEES: Record<string, number> = {
  ebay: 0.1325,
  goat: 0.12,
  stockx: 0.125,
  facebook: 0.05,
  offerup: 0.129,
};

export default function NewItemPage() {
  const router = useRouter();
  const { authReady, uid } = useAuth();

  const [name, setName] = useState("");
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");
  const [qty, setQty] = useState("1");

  const [shippingCost, setShippingCost] = useState("0");
  const [platformFee, setPlatformFee] = useState("0");
  const [platform, setPlatform] = useState("ebay");

  const [shippingTouched, setShippingTouched] = useState(false);
  const [feeTouched, setFeeTouched] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ---- Auth guard ---- */
  useEffect(() => {
    if (!authReady) return;
    if (!uid) router.replace("/login");
  }, [authReady, uid, router]);

  /* ---- Estimators ---- */
  function estimateShipping(sell: string) {
    const s = Number(sell || 0);
    if (s >= 300) return 25;
    if (s >= 150) return 15;
    if (s >= 75) return 10;
    return 6;
  }

  function estimatePlatformFee(platform: string, sell: string) {
    const s = Number(sell || 0);
    const rate = PLATFORM_FEES[platform] ?? 0;
    return Math.round(s * rate);
  }

  /* ---- Auto‑estimate unless user edits ---- */
  useEffect(() => {
    if (!shippingTouched) {
      setShippingCost(String(estimateShipping(sell)));
    }
    if (!feeTouched) {
      setPlatformFee(String(estimatePlatformFee(platform, sell)));
    }
  }, [sell, platform]);

  /* ---- Profit calculation ---- */
  const profit = useMemo(() => {
    const b = Number(buy || 0);
    const s = Number(sell || 0);
    const q = Number(qty || 1);
    const ship = Number(shippingCost || 0);
    const fee = Number(platformFee || 0);
    return (s - b) * q - ship - fee;
  }, [buy, sell, qty, shippingCost, platformFee]);

  /* ---- Save ---- */
  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!uid) return;
    if (!name.trim()) return setErr("Name is required");
    if (!buy || !sell) return setErr("Buy and sell are required");

    setLoading(true);
    try {
      await addDoc(collection(db, "items"), {
        uid,
        name: name.trim(),
        buy: Number(buy),
        sell: Number(sell),
        qty: Number(qty || 1),
        shippingCost: Number(shippingCost || 0),
        platformFee: Number(platformFee || 0),
        platform,
        profit,
        createdAt: serverTimestamp(),
      });

      router.replace("/items");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return null;

  
  return (
    <main className="container hero">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1>Add item</h1>

        <form onSubmit={onSave} className="stack">
          <input
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Buy price"
            inputMode="decimal"
            value={buy}
            onChange={(e) => setBuy(e.target.value)}
          />

          <input
            placeholder="Sell price"
            inputMode="decimal"
            value={sell}
            onChange={(e) => setSell(e.target.value)}
          />

          <div className="stack">
            <label className="muted">Quantity</label>
            <input
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>

          <div className="stack">
            <label className="muted">Shipping cost</label>
            <input
              inputMode="decimal"
              value={shippingCost}
              onChange={(e) => {
                setShippingTouched(true);
                setShippingCost(e.target.value);
              }}
            />
          </div>

          <div className="stack">
            <label className="muted">Platform fee</label>
            <input
              inputMode="decimal"
              value={platformFee}
              onChange={(e) => {
                setFeeTouched(true);
                setPlatformFee(e.target.value);
              }}
            />
          </div>

          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="ebay">eBay</option>
            <option value="goat">GOAT</option>
            <option value="stockx">StockX</option>
            <option value="facebook">Facebook</option>
            <option value="offerup">OfferUp</option>
          </select>

          <div
            style={{
              fontWeight: 900,
              fontSize: 18,
              color: profit >= 0 ? "#35d07f" : "#ff6b6b",
            }}
          >
            Profit: {profit >= 0 ? "+" : ""}
            {profit.toLocaleString()}
          </div>

          <button className="primary" disabled={loading}>
            {loading ? "Saving…" : "Save item"}
          </button>

          {err && <div className="muted">{err}</div>}
        </form>
      </div>
    </main>
  );
}
