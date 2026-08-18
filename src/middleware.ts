import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001", "*"];

export function middleware(request: NextRequest) {
  // If we just want to allow everything for development:
  const origin = request.headers.get("origin") ?? "";
  const isAllowedOrigin = allowedOrigins.includes(origin) || allowedOrigins.includes("*");
  
  // Handle preflight requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });
    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin || "*");
    }
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
    return response;
  }

  // Handle actual requests
  const response = NextResponse.next();
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin || "*");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept");
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
