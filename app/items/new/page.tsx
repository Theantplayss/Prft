"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

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

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!uid) router.replace("/login");
  }, [authReady, uid, router]);

  const profit = useMemo(() => {
    const b = Number(buy || 0);
    const s = Number(sell || 0);
    const q = Number(qty || 1);
    const ship = Number(shippingCost || 0);
    const fee = Number(platformFee || 0);
    return (s - b) * q - ship - fee;
  }, [buy, sell, qty, shippingCost, platformFee]);

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
          <input placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Buy price" inputMode="decimal" value={buy} onChange={(e) => setBuy(e.target.value)} />
          <input placeholder="Sell price" inputMode="decimal" value={sell} onChange={(e) => setSell(e.target.value)} />

          <input placeholder="Quantity" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          <input placeholder="Shipping cost" inputMode="decimal" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} />
          <input placeholder="Platform fee" inputMode="decimal" value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} />

          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="ebay">eBay</option>
            <option value="facebook">Facebook</option>
            <option value="offerup">OfferUp</option>
            <option value="other">Other</option>
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
