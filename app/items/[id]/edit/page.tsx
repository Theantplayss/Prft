"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { authReady, uid } = useAuth();

  const [name, setName] = useState("");
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");
  const [qty, setQty] = useState("1");
  const [shippingCost, setShippingCost] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [extraFees, setExtraFees] = useState("");
  const [platform, setPlatform] = useState("ebay");
  const [status, setStatus] = useState<"listed" | "sold">("listed");

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
      try {
        const ref = doc(db, "items", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setErr("Item not found.");
          setLoaded(true);
          return;
        }

        const data = snap.data() as any;

        if (data.uid !== uid) {
          setErr("You don’t have permission to edit this item.");
          setLoaded(true);
          return;
        }

        setName(data.name ?? "");
        setBuy(String(data.buy ?? ""));
        setSell(String(data.sell ?? ""));
        setQty(String(data.qty ?? 1));
        setShippingCost(String(data.shippingCost ?? 0));
        setPlatformFee(String(data.platformFee ?? 0));
        setExtraFees(String(data.extraFees ?? 0));
        setPlatform(data.platform ?? "ebay");
        setStatus((data.status ?? "listed") as any); // ✅ NEW (default for old items)

        setLoaded(true);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load item");
        setLoaded(true);
      }
    })();
  }, [authReady, uid, id]);

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
    setErr(null);

    if (!uid) return;
    if (!name.trim()) return setErr("Name is required");
    if (!buy || !sell) return setErr("Buy and sell are required");

    setLoading(true);
    try {
      await updateDoc(doc(db, "items", id), {
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
        <div className="row">
          <h1 style={{ margin: 0 }}>Edit item</h1>
          <button type="button" onClick={() => router.replace("/items")}>
            Cancel
          </button>
        </div>

        <div style={{ height: 12 }} />

        <form onSubmit={onSave} className="stack">
          <input value={name} onChange={(e) => setName(e.target.value)} />

          <input placeholder="Buy price" inputMode="decimal" value={buy} onChange={(e) => setBuy(e.target.value)} />
          <input placeholder="Sell price" inputMode="decimal" value={sell} onChange={(e) => setSell(e.target.value)} />

          <div className="stack">
            <label className="muted">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="listed">Listed</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          <div className="stack">
            <label className="muted">Quantity</label>
            <input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>

          <div className="stack">
            <label className="muted">Shipping cost</label>
            <input inputMode="decimal" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} />
          </div>

          <div className="stack">
            <label className="muted">Platform fee</label>
            <input inputMode="decimal" value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} />
          </div>

          <div className="stack">
            <label className="muted">Extra fees (promo, boosts, etc.)</label>
            <input inputMode="decimal" value={extraFees} onChange={(e) => setExtraFees(e.target.value)} />
          </div>

          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="ebay">eBay</option>
            <option value="goat">GOAT</option>
            <option value="stockx">StockX</option>
            <option value="facebook">Facebook</option>
            <option value="offerup">OfferUp</option>
          </select>

          <div style={{ fontWeight: 900, fontSize: 18, color: profit >= 0 ? "#35d07f" : "#ff6b6b" }}>
            Profit: {profit >= 0 ? "+" : ""}
            {profit.toLocaleString()}
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button type="button" onClick={() => router.replace("/items")}>
              Cancel
            </button>
            <button className="primary" disabled={loading} type="submit">
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>

          {err && <div className="muted">{err}</div>}
        </form>
      </div>
    </main>
  );
}
