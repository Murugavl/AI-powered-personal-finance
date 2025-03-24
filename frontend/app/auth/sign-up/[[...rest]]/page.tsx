"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-cover bg-center p-4">
      <SignUp routing="path" path="/auth/sign-up" />
    </div>
  );
}
