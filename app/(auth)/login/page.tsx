"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useLocale } from "@/components/locale-provider";

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError(t("auth.invalidCredentials"));
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <Image
          src={theme === "dark" ? "/logo.png" : "/logo-light.png"}
          alt="xQuant"
          width={2172}
          height={720}
          priority
          className="h-10 w-auto mb-2"
        />
        <p className="text-text-secondary mb-6">{t("auth.signInTagline")}</p>

        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            required
          />
          <Input
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.passwordPlaceholder")}
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            {t("auth.signIn")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-accent hover:underline">
            {t("auth.register")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
