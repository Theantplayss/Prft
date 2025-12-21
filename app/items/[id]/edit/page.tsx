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
  const [platform, setPlatform] = useState("ebay");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Protect page
  useEffect(() => {
    if (!authReady) return;
    if (!uid) router.replace("/login");
  }, [authReady, uid, router]);

  // Load item once
  useEffect(() => {
    if (!authReady || !uid) return;

    (async () => {
      try {
        const ref = doc(db, "items", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setErr("Item not found.");
          setInitialLoaded(true);
          return;
        }

        const data = snap.data() as any;

        // Extra safety: if user doesn’t own it, block
        if (data.uid !== uid) {
          setErr("You don’t have permission to edit this item.");
          setInitialLoaded(true);
          return;
        }

        setName(data.name ?? "");
        setBuy(String(data.buy ?? ""));
        setSell(String(data.sell ?? ""));
        setPlatform(data.platform ?? "ebay");
        setInitialLoaded(true);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load item");
        setInitialLoaded(true);
      }
    })();
  }, [authReady, uid, id]);

  const profit = useMemo(() => {
    const b = Number(buy || 0);
    const s = Number(sell || 0);
    return s - b;
  }, [buy, sell]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!uid) return;
    if (!name.trim()) return setErr("Name is required.");
    if (!buy || !sell) return setErr("Buy and sell are required.");

    setLoading(true);
    try {
      await updateDoc(doc(db, "items", id), {
        name: name.trim(),
        buy: Number(buy),
        sell: Number(sell),
        platform,
        profit: Number(sell) - Number(buy),
        updatedAt: serverTimestamp(),
      });

      router.replace("/items");
    } catch (e: any) {
      setErr(e?.code ? `${e.code}: ${e.message}` : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) return <main className="container">Loading…</main>;
  if (!uid) return null;
  if (!initialLoaded) return <main className="container">Loading item…</main>;

  return (
    <main className="container hero">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="row">
          <h1 style={{ margin: 0 }}>Edit item</h1>
          <a href="/items">
            <button>Back</button>
          </a>
        </div>

        <div style={{ height: 12 }} />

        <form onSubmit={onSave} className="stack">
          <input value={name} onChange={(e) => setName(e.target.value)} />

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

          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="ebay">eBay</option>
            <option value="facebook">Facebook</option>
            <option value="offerup">OfferUp</option>
            <option value="other">Other</option>
          </select>

          <div className="muted">Profit: {profit}</div>

          <button className="primary" disabled={loading} type="submit">
            {loading ? "Saving..." : "Save changes"}
          </button>

          {err && <div className="muted">{err}</div>}
        </form>
      </div>
    </main>
  );
}
