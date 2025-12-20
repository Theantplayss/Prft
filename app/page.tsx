"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function HomePage() {
  return (
    <main className="container">
      <div className="card" style={{ padding: 22 }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.5 }}>
          Prft
        </h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Track your flips. Know your profit.
        </p>

        <div style={{ height: 14 }} />

        <div className="row" style={{ justifyContent: "flex-start" }}>
          <a href="/items">
            <button>Open dashboard</button>
          </a>
          <a href="/items/new">
            <button>+ Add item</button>
          </a>
        </div>

        <div style={{ height: 10 }} />

        <div className="muted" style={{ fontSize: 14 }}>
          Tip: Sign in on any device and your items stay synced.
        </div>
      </div>
    </main>
  );
}
