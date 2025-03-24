import { clerkMiddleware } from "@clerk/nextjs/server"; // Ensure correct import
import { NextResponse } from "next/server";

export default clerkMiddleware({
  publicRoutes: ["/auth/login", "/auth/sign-up"],
})
 

