"use client";

import { useRouter } from "next/navigation";
import { useAuth, SignIn } from "@clerk/nextjs";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  // Redirect to Dashboard if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, router]);

  return (
    <div 
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
    >
      <div className="mt-32">
        <SignIn routing="path" path="/auth/login" signUpUrl="/auth/sign-up" />
      </div>
    </div>
  );
}
