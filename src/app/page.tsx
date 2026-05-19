"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { copy } from "@/lib/gambas-copy";

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
        <Image
          src="/logo.png"
          alt={copy.appName}
          width={80}
          height={80}
          className="mx-auto rounded-2xl object-contain"
          priority
        />
        <p className="text-gradient font-bold text-xl mt-3">{copy.appName}</p>
      </div>
    </div>
  );
}
