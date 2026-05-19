"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { RightSidebar } from "./RightSidebar";
import { MobileNav } from "./MobileNav";
import { useAuth } from "@/lib/auth/context";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gambas-bg bg-mesh flex items-center justify-center">
        <div className="text-center animate-pulse-soft">
          <span className="text-4xl">🦐</span>
          <p className="text-gambas-muted mt-2 text-sm">Cargando gambasillo...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gambas-bg bg-mesh">
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        <main className="flex-1 min-w-0 max-w-2xl border-x border-gambas-border/30 min-h-screen pb-20 lg:pb-0">
          {children}
        </main>
        <RightSidebar />
      </div>
      <MobileNav />
    </div>
  );
}
