import type { ReactNode } from "react";
import { Header } from "@client/components/Header";
import { Footer } from "@client/components/Footer";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
