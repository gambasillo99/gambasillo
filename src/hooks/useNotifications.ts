"use client";

import { useCallback, useEffect, useState } from "react";
import type { Notification } from "@/types";
import { getNotifications, markNotificationsRead } from "@/lib/data/store";

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getNotifications(userId);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await markNotificationsRead(userId);
    setUnreadCount(0);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
  }, [userId]);

  return { notifications, unreadCount, loading, refresh: load, markAllRead };
}
