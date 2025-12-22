"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

export default function EditItemPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { authReady, uid } = useAuth();

  const [name, setName] = useState("");
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");
  const [qty, setQty] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [platform, setPlatform] = useState("ebay");

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!uid) router.replace("/login");
  }, [authReady, uid, router]);

  useEffect(() => {
    if (!authReady || !uid) return;

    (async () => {
      const snap = await getDoc(doc(db, "items", id));
      if (!snap.exists()) {
        setErr("Item not found");
        setLoaded(true);
        return;
      }

      const data = snap.data() as any;
      if (data.uid !== uid) {
        setErr("No permission");
        setLoaded(true);
        return;
      }

      setName(data.name ?? "");
      setBuy(String(data.buy ?? ""));
      setSell(String(data.sell ?? ""));
      setQty(String(data.qty ?? 1));
      setShippingCost(String(data.shippingCost ?? 0));
      setPlatformFee(String(data.platformFee ?? 0));
      setPlatform(data.platform ?? "ebay");
      setLoaded(true);
    })();
  }, [authReady, uid, id]);

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

    setLoading(true);
    try {
      await updateDoc(doc(db, "items", id), {
        name: name.trim(),
        buy: Number(buy),
        sell: Number(sell),
        qty: Number(qty || 1),
        shippingCost: Number(shippingCost || 0),
        platformFee: Number(platformFee || 0),
        platform,
        profit,
        updatedAt: serverTimestamp(),
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
  if (!loaded) return <main className="container">Loading item…</main>;

  return (
    <main className="container hero">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1>Edit item</h1>

        <form onSubmit={onSave} className="stack">
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Buy price" inputMode="decimal" value={buy} onChange={(e) => setBuy(e.target.value)} />
          <input placeholder="Sell price" inputMode="decimal" value={sell} onChange={(e) => setSell(e.target.value)} />

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
    onChange={(e) => setShippingCost(e.target.value)}
  />
</div>

<div className="stack">
  <label className="muted">Platform fee</label>
  <input
    inputMode="decimal"
    value={platformFee}
    onChange={(e) => setPlatformFee(e.target.value)}
  />
</div>


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
            {loading ? "Saving…" : "Save changes"}
          </button>

          {err && <div className="muted">{err}</div>}
        </form>
      </div>
    </main>
  );
}
