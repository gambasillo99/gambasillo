"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/context";
import { copy } from "@/lib/gambas-copy";

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await register({
      username,
      password,
      displayName: displayName || undefined,
    });
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="text-center mb-8">
        <Logo size="lg" className="justify-center" />
        <p className="text-gambas-muted mt-3 text-sm">
          {copy.registerSubtitle}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-gambas-card/60 border border-gambas-border/40 p-6 shadow-card space-y-4 backdrop-blur-sm"
      >
        <Input
          label="@usuario"
          prefix="@"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="tu_usuario"
          autoComplete="username"
          required
        />
        <Input
          label="Nombre (opcional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Cómo te verán"
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          required
        />
        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="text-center text-gambas-muted text-sm mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="text-gambas-accent hover:underline font-medium"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
