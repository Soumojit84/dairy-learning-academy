import "server-only";
import { z } from "zod";
import { createSupabaseServerClient } from "@/backend/infrastructure/supabase/server-client";

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(8).max(128);
const registerSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(8).max(128),
}).refine((payload) => payload.password === payload.confirmPassword, {
  path: ["confirmPassword"],
  message: "The passwords do not match.",
});

const payloadSchemas = {
  login: z.object({ email: emailSchema, password: z.string().min(1).max(128), destination: z.enum(["student", "admin"]).default("student") }),
  register: registerSchema,
  "reset-password": z.object({ email: emailSchema }),
  "update-password": z.object({ password: passwordSchema }),
  signout: z.object({}).strict(),
} as const;

export type AuthAction = keyof typeof payloadSchemas;
export type AuthPayload<A extends AuthAction> = z.infer<(typeof payloadSchemas)[A]>;

export class AuthServiceError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function authErrorMessage(error: { code?: string; message: string; status?: number }, action: AuthAction) {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message.toLowerCase();

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Please confirm your email address using the link we sent before signing in.";
  }
  if (code === "weak_password" || message.includes("password") && message.includes("weak")) {
    return "Choose a stronger password with at least eight characters.";
  }
  if (code === "user_already_exists" || code === "email_exists" || message.includes("already registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (code === "email_address_invalid" || code === "validation_failed" && message.includes("email")) {
    return "Enter a valid email address.";
  }
  if (action === "login" && (code === "invalid_credentials" || message.includes("invalid login credentials") || message.includes("invalid credentials"))) {
    return "Email or password is incorrect.";
  }
  if ((error.status ?? 0) >= 500 || code === "unexpected_failure") {
    return "The authentication service or profile database is temporarily unavailable. Please try again later.";
  }
  if (action === "login") return "Unable to sign in right now. Please check your details and try again.";
  if (action === "register") return "Unable to create your account right now. Please check your details and try again.";
  return "Unable to complete that authentication request. Please try again later.";
}

function getAuthCallbackUrl(next: "/dashboard" | "/reset-password") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new AuthServiceError("The application URL is not configured.", 503);

  try {
    const baseUrl = new URL(appUrl);
    if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") throw new Error("Unsupported protocol");
    return new URL(`/auth/callback?next=${next}`, baseUrl).toString();
  } catch {
    throw new AuthServiceError("The application URL is invalid. Configure NEXT_PUBLIC_APP_URL and try again.", 503);
  }
}

export async function executeAuthAction(action: AuthAction, input: unknown) {
  const parsed = payloadSchemas[action].safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    if (action === "register" && issue?.code === "custom" && field === "confirmPassword") {
      throw new AuthServiceError("The passwords do not match.", 400);
    }
    if (field === "email") throw new AuthServiceError("Enter a valid email address.", 400);
    if (field === "password") throw new AuthServiceError("Password must be between 8 and 128 characters.", 400);
    if (field === "fullName") throw new AuthServiceError("Enter your full name (up to 120 characters).", 400);
    if (field === "confirmPassword") throw new AuthServiceError("Confirm your password.", 400);
    throw new AuthServiceError("Please check the information and try again.", 400);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new AuthServiceError("Authentication is not configured.", 503);

  if (action === "login") {
    const { email, password, destination } = parsed.data;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new AuthServiceError(authErrorMessage(error, action), error.code === "email_not_confirmed" ? 403 : 401);
    return { message: "Signed in.", redirectTo: destination === "admin" ? "/admin" : "/dashboard" };
  }

  if (action === "register") {
    const { email, password, fullName } = parsed.data;
    const emailRedirectTo = getAuthCallbackUrl("/dashboard");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo },
    });
    if (error) throw new AuthServiceError(authErrorMessage(error, action), error.status ?? 400);
    if (data.user?.identities?.length === 0) {
      throw new AuthServiceError("An account with this email already exists. Please sign in instead.", 409);
    }
    return data.session
      ? { message: "Account created.", redirectTo: "/dashboard" }
      : { message: "Check your inbox to confirm your email and finish creating your account." };
  }

  if (action === "reset-password") {
    const { email } = parsed.data;
    const callback = getAuthCallbackUrl("/reset-password");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback });
    if (error) throw new AuthServiceError(authErrorMessage(error, action), error.status ?? 400);
    return { message: "If an account exists for that email, a password reset link is on its way." };
  }

  if (action === "update-password") {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new AuthServiceError("Your recovery session has expired. Request a new reset link.", 401);
    const { password } = parsed.data;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new AuthServiceError(authErrorMessage(error, action), error.status ?? 400);
    return { message: "Password updated." };
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw new AuthServiceError("Unable to sign out. Please try again.", 500);
  return { message: "Signed out.", redirectTo: "/login" };
}

export async function completeAuthCallback(callbackUrl: URL) {
  const supabase = await createSupabaseServerClient();
  const code = callbackUrl.searchParams.get("code");
  if (!supabase || !code) return { redirectTo: "/login?error=auth-callback" };

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return { redirectTo: "/login?error=auth-callback" };

  const requestedPath = callbackUrl.searchParams.get("next") ?? "/dashboard";
  try {
    const destination = new URL(requestedPath, callbackUrl.origin);
    if (destination.origin === callbackUrl.origin && requestedPath.startsWith("/") && !requestedPath.startsWith("//")) {
      return { redirectTo: `${destination.pathname}${destination.search}${destination.hash}` };
    }
  } catch {
    // Invalid callback destinations fall back to the student dashboard.
  }
  return { redirectTo: "/dashboard" };
}