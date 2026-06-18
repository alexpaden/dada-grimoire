"use client";

import { useState, useEffect } from "react";
import { api } from "./api";

export interface Identity {
  id: number;
  handle: string;
  role: string;
  bio: string;
  points: number;
  staff_note?: string;
  is_npc?: boolean;
  solved?: string[];
}

let cachedIdentity: Identity | null = null;
let inFlight: Promise<Identity> | null = null;

export async function bootstrap(): Promise<Identity> {
  // Dedupe concurrent callers (Nav + page) so a fresh visit mints one identity.
  if (cachedIdentity) return cachedIdentity;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const data = await api.get<Identity & { token: string }>("/api/me/");
    if (data.token) {
      localStorage.setItem("grimoire_token", data.token);
    }
    cachedIdentity = data;
    return data;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(cachedIdentity);
  const [loading, setLoading] = useState(!cachedIdentity);

  useEffect(() => {
    if (cachedIdentity) {
      setIdentity(cachedIdentity);
      setLoading(false);
      return;
    }
    bootstrap()
      .then((id) => {
        setIdentity(id);
        cachedIdentity = id;
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { identity, loading };
}
