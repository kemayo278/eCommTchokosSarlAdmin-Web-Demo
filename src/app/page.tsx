"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/auth/login");
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-aurora">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
