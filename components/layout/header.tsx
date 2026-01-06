"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const role = session?.user?.role;

  const navItems = role === "EMPLOYER"
    ? [
        { href: "/employer/jobs", label: "My Jobs" },
        { href: "/employer/applicants", label: "Applicants" },
        { href: "/employer/interviews", label: "Interviews" },
        { href: "/employer/company", label: "Company" },
        { href: "/employer/reviews", label: "Reviews" },
      ]
    : role === "ADMIN"
    ? [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/reviews", label: "Reviews" },
      ]
    : [
        { href: "/jobs", label: "Find Jobs" },
        { href: "/applications", label: "My Applications" },
        { href: "/interviews", label: "Interviews" },
        { href: "/reviews", label: "Reviews" },
        { href: "/profile", label: "Profile" },
      ];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href={session ? (role === "EMPLOYER" ? "/employer/jobs" : role === "ADMIN" ? "/admin" : "/jobs") : "/"} className="text-xl font-bold text-blue-600">
              Launchpad
            </Link>

            {session && (
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm text-gray-600 hidden sm:block">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
