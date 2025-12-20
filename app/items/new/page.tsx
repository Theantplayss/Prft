"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function NewItemPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");
  const [platform, setPlatform] = useState("ebay");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const profit = useMemo(() => {
    const b = Number(buy || 0);
    const s = Number(sell || 0);
    return s - b;
  }, [buy, sell]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      if (!u) router.push("/login");
    });
    return () => unsub();
  }, [router]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!uid) return;
    if (!name.trim()) return setErr("Name is required.");
    if (!buy || !sell) return setErr("Buy and sell are required.");

    setLoading(true);
    try {
      await addDoc(collection(db, "items"), {
        uid,
        name: name.trim(),
        buy: Number(buy),
        sell: Number(sell),
        platform,
        profit: Number(sell) - Number(buy),
        createdAt: serverTimestamp(),
      });
      router.push("/items");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 520 }}>
      <h1>Add item</h1>

      <form onSubmit={onSave} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />

        <input placeholder="Buy price" value={buy} onChange={(e) => setBuy(e.target.value)} />
        <input placeholder="Sell price" value={sell} onChange={(e) => setSell(e.target.value)} />

        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="ebay">eBay</option>
          <option value="depop">Depop</option>
          <option value="stockx">StockX</option>
          <option value="poshmark">Poshmark</option>
          <option value="other">Other</option>
        </select>

        <p>Profit: <strong>{isNaN(profit) ? "—" : profit}</strong></p>

        <button disabled={loading} type="submit">
          {loading ? "Saving..." : "Save item"}
        </button>

        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
    </main>
  );
}
