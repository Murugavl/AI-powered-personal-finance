import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware - auth is handled client-side via AuthProvider
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
