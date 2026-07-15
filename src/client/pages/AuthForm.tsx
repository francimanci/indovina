import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button, Card, Field, Input } from "@client/components/ui";
import { ApiError } from "@client/lib/api";
import { credentialsSchema } from "@shared/types";
import { useLogin, useSignup } from "@client/lib/auth";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const [, navigate] = useLocation();
  const search = useSearch();
  const next = new URLSearchParams(search).get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const login = useLogin();
  const signup = useSignup();
  const active = mode === "login" ? login : signup;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldError(flat.email?.[0] ?? flat.password?.[0] ?? "Invalid input");
      return;
    }
    active.mutate(parsed.data, {
      onSuccess: () => navigate(decodeURIComponent(next), { replace: true }),
    });
  };

  const isLogin = mode === "login";

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-ink">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {isLogin
            ? "Log in to see your plan and documents."
            : "Save your plan and generate documents."}
        </p>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field
            label="Password"
            hint={isLogin ? undefined : "At least 8 characters."}
          >
            <Input
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {(fieldError || active.isError) && (
            <p className="text-sm text-red-600">
              {fieldError ??
                (active.error instanceof ApiError
                  ? active.error.message
                  : "Something went wrong.")}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={active.isPending}>
            {active.isPending
              ? isLogin
                ? "Logging in…"
                : "Creating account…"
              : isLogin
                ? "Log in"
                : "Create account"}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-ink-muted">
        {isLogin ? (
          <>
            No account?{" "}
            <Link href="/signup" className="font-medium text-accent-700 hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent-700 hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
