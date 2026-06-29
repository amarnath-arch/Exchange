"use client";

import { useAuth } from "@/context/useAuth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const { isLoggedIn, logOut } = useAuth();
  const router = useRouter();

  const links = [
    { to: "/markets", label: "Markets" },
    // { to: "/trade", label: "Trade" },
    { to: "/wallet", label: "Wallet" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded bg-accent text-accent-foreground mono text-sm font-bold">
              B
            </span>
            <span className="mono text-sm font-bold tracking-tight">
              BeeNance
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const isActive = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  href={l.to}
                  className={`rounded px-3 py-1.5 text-sm transition-colors hover:bg-surface-2 hover:text-foreground ${
                    isActive
                      ? "text-foreground bg-surface-2"
                      : "text-muted-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        {!isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Link href="/auth?mode=signin" className="btn-ghost text-sm">
              Sign in
            </Link>
            <Link href="/auth?mode=signup" className="btn-primary text-sm">
              Sign up
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost text-sm bg-primary text-black font-semibold"
              onClick={() => {
                logOut();
                router.push("/");
              }}
            >
              LogOut
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
