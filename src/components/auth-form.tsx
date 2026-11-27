"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type AuthView = "login" | "register" | "reset";

export function AuthForm({ admin = false, initialView = "login" }: { admin?: boolean; initialView?: AuthView }) {
  const [view, setView] = useState<AuthView>(initialView);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "auth-callback") {
      setError("That confirmation or password recovery link is invalid or expired. Request a new link and try again.");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const payload: Record<string, string> = {
      email: String(formData.get("email") ?? "").trim(),
    };
    if (view === "register") {
      payload.fullName = String(formData.get("fullName") ?? "").trim();
      payload.confirmPassword = String(formData.get("confirmPassword") ?? "");
      if (password !== payload.confirmPassword) {
        setError("The passwords do not match.");
        return;
      }
    }
    if (view !== "reset") payload.password = password;
    if (view === "login") payload.destination = admin ? "admin" : "student";
    const action = view === "login" ? "login" : view === "register" ? "register" : "reset-password";
    setBusy(true);

    try {
      const response = await fetch(`/api/auth/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string; message?: string; redirectTo?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to complete that request.");
      if (result.redirectTo) {
        router.replace(result.redirectTo);
        router.refresh();
      } else {
        setMessage(result.message ?? "Request completed.");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to complete that request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const heading = view === "register" ? "Create your student account" : view === "reset" ? "Reset your password" : admin ? "Administrator sign in" : "Welcome back";
  const submitLabel = view === "register" ? "Create account" : view === "reset" ? "Send reset link" : "Sign in";

  return (
    <div className="auth-panel">
      <h2>{heading}</h2>
      <p>{view === "reset" ? "We will send a secure recovery link if the account is registered." : admin ? "Admin access is verified on the server. There is no public admin registration." : "Use your academy account to continue learning."}</p>
      <form onSubmit={handleSubmit}>
        {view === "register" && <label className="field">Full name<input autoComplete="name" maxLength={120} name="fullName" required /></label>}
        <label className="field">Email address<input autoComplete="email" name="email" required type="email" /></label>
        {view !== "reset" && <label className="field">Password<input autoComplete={view === "register" ? "new-password" : "current-password"} minLength={view === "register" ? 8 : undefined} name="password" required type="password" /></label>}
        {view === "register" && <label className="field">Confirm password<input autoComplete="new-password" minLength={8} name="confirmPassword" required type="password" /></label>}
        {error && <p className="form-message form-error" role="alert"><AlertCircle size={16} />{error}</p>}
        {message && <p className="form-message form-success" role="status"><CheckCircle2 size={16} />{message}</p>}
        <button className="button button-green auth-submit" disabled={busy} type="submit">{busy ? "Please wait…" : submitLabel}</button>
      </form>
      {!admin && view === "login" && <button className="quiet-button" onClick={() => { setView("reset"); setError(""); setMessage(""); }} type="button">Forgot password?</button>}
      {!admin && view !== "reset" && <p className="auth-switch">{view === "register" ? "Already registered?" : "New to the academy?"} <button onClick={() => { setView(view === "register" ? "login" : "register"); setError(""); setMessage(""); }} type="button">{view === "register" ? "Sign in" : "Create an account"}</button></p>}
      {view === "reset" && <p className="auth-switch"><button onClick={() => { setView("login"); setError(""); setMessage(""); }} type="button">Back to sign in</button></p>}
      {admin && <p className="auth-switch"><Link href="/login">Student login</Link></p>}
    </div>
  );
}

export function PasswordUpdateForm() {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to update the password.");
      setDone(true);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-panel">
      <h2>Choose a new password</h2>
      <p>Use at least eight characters for your account password.</p>
      {done ? <p className="form-message form-success"><CheckCircle2 size={16} />Password updated. <Link href="/login">Sign in</Link></p> : <form onSubmit={updatePassword}>
        <label className="field">New password<input autoComplete="new-password" minLength={8} name="password" required type="password" /></label>
        <label className="field">Confirm new password<input autoComplete="new-password" minLength={8} name="confirmation" required type="password" /></label>
        {error && <p className="form-message form-error" role="alert"><AlertCircle size={16} />{error}</p>}
        <button className="button button-green auth-submit" disabled={busy} type="submit">{busy ? "Updating…" : "Update password"}</button>
      </form>}
    </div>
  );
}