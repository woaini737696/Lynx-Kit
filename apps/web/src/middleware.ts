import { NextResponse, type NextRequest } from "next/server";

// 受保护路径前缀（需登录才能访问）
const PROTECTED_PREFIX = "/console";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("lynxkit_token")?.value;

  // 访问控制台但无 token，重定向到登录页
  if (pathname.startsWith(PROTECTED_PREFIX) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录用户访问登录/注册页，重定向到控制台
  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/console", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/console/:path*", "/login", "/register"],
};
