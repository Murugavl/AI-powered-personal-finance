"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import Chatbot from "@/components/Chatbot";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth(); // Clerk authentication state

  useEffect(() => {
    // Redirect to login page if not authenticated
    if (isSignedIn === false && pathname !== "/auth/login") {
      router.push("/auth/login");
    }
  }, [isSignedIn,router]); // Included pathname in dependencies

  // Hide Navbar on authentication pages
  const authRoutes = ["/auth/login", "/auth/sign-up"];
  const shouldShowNavbar = !authRoutes.includes(pathname);

  return (
    <ThemeProvider>
      {shouldShowNavbar && <Navbar />} {/* Navbar is hidden on auth pages */}
      <main className="container mx-auto">{children}</main>

      {/* Chatbot only appears when user is signed in */}
      {isSignedIn && <Chatbot />}
    </ThemeProvider>
  );
}
