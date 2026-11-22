import crypto from "crypto";

export const JWT_SECRET = process.env.JWT_SECRET || "super_secret_rakshaai_jwt_key";

export interface AuthSession {
  userId: string;
  email: string;
  phone?: string;
  role: "coordinator" | "donor" | "patient" | string;
  name?: string;
  exp?: number;
}

export interface AuthVerificationResult {
  authenticated: boolean;
  user: AuthSession | null;
  error?: "missing_token" | "invalid_token" | "expired_token";
}

/**
 * Verifies HS256 JWT signature using constant-time comparison.
 * Extracts verified payload and checks expiration.
 */
export function verifyJWT(token: string, secret: string = JWT_SECRET): AuthSession {
  if (!token || typeof token !== "string") {
    throw new Error("missing_token");
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("invalid_token");
  }
  const [header, body, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  if (
    expectedSignature.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  ) {
    throw new Error("invalid_token");
  }

  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    throw new Error("invalid_token");
  }

  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error("expired_token");
  }

  if (!payload.role) {
    throw new Error("invalid_token");
  }

  return {
    userId: payload.userId || payload.sub || "",
    email: payload.email || "",
    phone: payload.phone || "",
    role: payload.role,
    name: payload.name || "",
    exp: payload.exp,
  };
}

/**
 * Signs an HS256 JWT for tests or session issuance.
 */
export function signJWT(
  payload: Record<string, any>,
  secret: string = JWT_SECRET,
  expiresInSeconds: number = 7 * 24 * 3600
): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

/**
 * Extracts and verifies the raksha_token JWT from HTTP-only cookie or Authorization header.
 * Rejects missing, invalid, or expired tokens.
 * Never trusts client-supplied roles.
 */
export async function verifyAuth(req?: Request): Promise<AuthVerificationResult> {
  let token: string | undefined;

  // 1. Check Authorization Bearer header
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  // 2. Check Cookie header from Request
  if (!token && req) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)raksha_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  // 3. Fallback to next/headers cookies() store if available
  if (!token) {
    try {
      // Dynamic import to avoid hard dependency failure in standalone tests
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      token = cookieStore.get("raksha_token")?.value;
    } catch {
      // Outside Next.js SSR context
    }
  }

  if (!token) {
    return { authenticated: false, user: null, error: "missing_token" };
  }

  try {
    const user = verifyJWT(token, JWT_SECRET);
    return { authenticated: true, user };
  } catch (err: any) {
    const errorType = err.message === "expired_token" ? "expired_token" : "invalid_token";
    return { authenticated: false, user: null, error: errorType };
  }
}

/**
 * Route Handler guard: enforces authentication and optional role-based authorization.
 * Returns null if authorized, or a Response (401/403) to return immediately.
 */
export async function authorizeRequest(
  req: Request,
  allowedRoles?: string[]
): Promise<{ user: AuthSession; errorResponse?: never } | { user?: never; errorResponse: Response }> {
  const result = await verifyAuth(req);

  if (!result.authenticated || !result.user) {
    return {
      errorResponse: Response.json(
        {
          success: false,
          error: "Authentication required",
          code: result.error || "unauthorized",
        },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(result.user.role)) {
    return {
      errorResponse: Response.json(
        {
          success: false,
          error: "Forbidden: insufficient permissions for this resource",
          code: "forbidden",
        },
        { status: 403 }
      ),
    };
  }

  return { user: result.user };
}

/**
 * Specialized guard: strictly enforces coordinator role.
 */
export async function authorizeCoordinator(req: Request) {
  return authorizeRequest(req, ["coordinator"]);
}
