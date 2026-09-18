import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "troysining_session";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/invite", "/api/auth"];

// Route matcher -> roles allowed. Unlisted authenticated paths are open to any logged-in role.
// Order detail/print pages are intentionally excluded here: every role can land on a specific
// job order from the dashboard, kanban, or delivery board, even if the *list* views are restricted.
const ROLE_GATES: { test: (pathname: string) => boolean; roles: string[] }[] = [
  { test: (p) => p.startsWith("/admin"), roles: ["ADMIN"] },
  { test: (p) => p === "/orders" || p === "/orders/new", roles: ["ADMIN", "SALES"] },
  { test: (p) => p.startsWith("/crm"), roles: ["ADMIN", "SALES", "ENCODER"] },
  { test: (p) => p.startsWith("/products"), roles: ["ADMIN", "SALES", "ENCODER"] },
  { test: (p) => p.startsWith("/production"), roles: ["ADMIN", "PRODUCTION"] },
  { test: (p) => p.startsWith("/delivery"), roles: ["ADMIN", "DELIVERY"] },
  { test: (p) => p.startsWith("/expenses"), roles: ["ADMIN"] },
];

function secretKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "");
}

async function readSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as { role?: string };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/files/serve") ||
    pathname.startsWith("/favicon") ||
    pathname === "/logo.png" ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await readSession(token);

  const isApi = pathname.startsWith("/api");

  if (!session) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const gate = ROLE_GATES.find((g) => g.test(pathname));
  if (gate && !gate.roles.includes(session.role ?? "")) {
    if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|logo.png|apple-touch-icon.png).*)"],
};
