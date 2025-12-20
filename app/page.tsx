"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function HomePage() {
  return (
    <main className="container hero">
      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>PRFT</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Track your flips. Know your profit.
        </p>

        <div style={{ height: 16 }} />

        <div className="row" style={{ justifyContent: "flex-start" }}>
          <a href="/signup">
            <button className="primary">Sign up</button>
          </a>

          <a href="/login">
            <button>Log in</button>
          </a>
        </div>

        <div style={{ height: 12 }} />

        <div className="muted" style={{ fontSize: 14 }}>
          Create an account to access your dashboard on any device.
        </div>
      </div>
    </main>
  );
}

