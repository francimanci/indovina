import { Link } from "wouter";
import { Button } from "@client/components/ui";

export function NotFound() {
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-ink-muted">
        The page you were looking for doesn’t exist.
      </p>
      <Link href="/">
        <Button className="mt-6">Back to home</Button>
      </Link>
    </div>
  );
}
