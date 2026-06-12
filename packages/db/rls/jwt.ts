import { SignJWT } from "jose";

// LOCAL MODE: we mint HS256 JWTs with the local stack's JWT secret, shaped like
// the tokens Clerk issues for Supabase third-party auth (sub = Clerk user id,
// role = "authenticated"). This exercises the exact same RLS code paths —
// auth.jwt()->>'sub' — as production. LIVE MODE (real Clerk app + hosted
// Supabase validating via Clerk's JWKS) is the founder-gated spike step
// documented in packages/db/README.md.
export async function mintClerkShapedJwt(
  sub: string,
  jwtSecret: string,
): Promise<string> {
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(sub)
    .setAudience("authenticated")
    .setIssuer("https://fictional-clerk-instance.clerk.accounts.test")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(new TextEncoder().encode(jwtSecret));
}
