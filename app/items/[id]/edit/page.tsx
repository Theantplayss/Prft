"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");
  const [platform, setPlatform] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUid(u.uid);

      const ref = doc(db, "items", id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("Item not found");
        router.push("/items");
        return;
      }

      const data = snap.data() as any;

      // extra safety: don't let users edit someone else’s doc
      if (data.uid && data.uid !== u.uid) {
        alert("Not allowed");
        router.push("/items");
        return;
      }

      setName(data.name ?? "");
      setBuy(String(data.buy ?? ""));
      setSell(String(data.sell ?? ""));
      setPlatform(data.platform ?? "");

      setLoading(false);
    });

    return () => unsub();
  }, [id, router]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;

    const buyNum = Number(buy);
    const sellNum = Number(sell);

    await updateDoc(doc(db, "items", id), {
      name: name.trim(),
      buy: buyNum,
      sell: sellNum,
      platform,
      profit: sellNum - buyNum,
      // keep ownership unchanged; only set uid if it's missing
      uid,
    });

    router.push("/items");
  }

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1>Edit item</h1>

      <form onSubmit={onSave} style={{ display: "grid", gap: 12 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />

        <input value={buy} onChange={(e) => setBuy(e.target.value)} placeholder="Buy" />
        <input value={sell} onChange={(e) => setSell(e.target.value)} placeholder="Sell" />

        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
  <option value="ebay">eBay</option>
  <option value="stockx">StockX</option>
  <option value="grailed">Grailed</option>
  <option value="facebook">Facebook Marketplace</option>
  <option value="offerup">OfferUp</option>
  <option value="other">Other</option>
</select>

        <button type="submit">Save changes</button>
        <button type="button" onClick={() => router.push("/items")}>
          Cancel
        </button>
      </form>
    </main>
  );
}
