"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/feed" : "/login");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gambas-bg bg-mesh flex items-center justify-center">
      <div className="text-center animate-pulse-soft">
        <span className="text-5xl">🦐</span>
        <p className="text-gradient font-bold text-xl mt-3">Gambasillo</p>
      </div>
    </div>
  );
}
