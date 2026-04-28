"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("auth.registrationFailed"));
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">{t("auth.createAccount")}</h1>
        <p className="text-text-secondary mb-6">{t("auth.registerTagline")}</p>

        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("auth.name")} value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label={t("auth.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label={t("auth.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <Input label={t("auth.confirmPassword")} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button type="submit" loading={loading} className="w-full">
            {t("auth.createAccount")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="text-accent hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
