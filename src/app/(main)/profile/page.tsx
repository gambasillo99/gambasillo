"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

export default function ProfileRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(`/profile/${user.username}`);
    } else {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <div className="p-8 text-center text-gambas-muted animate-pulse-soft">
      Redirigiendo...
    </div>
  );
}
