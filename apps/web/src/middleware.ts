import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ログインページ自体は素通し
  if (pathname === "/admin/login") return NextResponse.next();

  // session_id cookie がなければログインページへ
  const session = req.cookies.get("session_id");
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
