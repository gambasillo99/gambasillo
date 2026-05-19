"use client";

import { useEffect } from "react";
import { sendPresence } from "@/lib/data/store";

const INTERVAL_MS = 60_000;

export function usePresence(userId?: string) {
  useEffect(() => {
    if (!userId) return;

    const ping = () => void sendPresence(userId);
    ping();
    const id = setInterval(ping, INTERVAL_MS);
    return () => clearInterval(id);
  }, [userId]);
}
