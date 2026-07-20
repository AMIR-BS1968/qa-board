"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Database, RefreshCw } from "lucide-react";

export function ConnectButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await signIn("google", 
        { callbackUrl: `/p/${slug}` },
        {
          scope: "openid email profile https://www.googleapis.com/auth/spreadsheets",
          prompt: "consent",
          access_type: "offline",
        }
      );
    } catch (err) {
      console.error("Sign-in failed:", err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Database className="w-4 h-4" />
          <span>Connect Google Account</span>
        </>
      )}
    </button>
  );
}
