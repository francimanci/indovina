import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuthUser } from "@client/lib/auth";

/**
 * Gate for authenticated pages. While the session is being checked we show a
 * neutral loading state; once we know the user is logged out we redirect to
 * /login, preserving where they were headed.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useAuthUser();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && user === null) {
      const next = encodeURIComponent(location);
      navigate(`/login?next=${next}`, { replace: true });
    }
  }, [isLoading, user, location, navigate]);

  if (isLoading || user === undefined) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center text-ink-muted">
        Loading…
      </div>
    );
  }

  if (user === null) return null; // redirect in flight

  return <>{children}</>;
}
