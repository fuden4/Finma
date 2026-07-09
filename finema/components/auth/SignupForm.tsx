"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { register } from "@/lib/api-client";
import { UserAvatar } from "@/components/profile/UserAvatar";

const inputClassName =
  "w-full px-4 py-3 rounded-lg bg-black/50 border border-white/10 text-finema-text placeholder:text-finema-muted/50 focus:outline-none focus:ring-2 focus:ring-finema-accent focus:border-transparent transition-shadow disabled:opacity-50";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const loginHref =
    redirect === "/"
      ? "/login"
      : `/login?redirect=${encodeURIComponent(redirect)}`;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  function triggerShake(message: string) {
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      triggerShake("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      triggerShake("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register(email, displayName, password, avatarFile);
      router.push(redirect);
      router.refresh();
    } catch (err) {
      triggerShake(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: shake ? [0, -10, 10, -10, 10, 0] : 0,
      }}
      transition={{ duration: shake ? 0.5 : 0.4 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <Link href="/" className="text-3xl font-bold tracking-tight inline-block">
          <span className="text-finema-accent">F</span>
          <span className="text-finema-text">inema</span>
        </Link>
      </div>

      <div className="rounded-xl bg-finema-surface/80 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold text-finema-text mb-6">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-center gap-4"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Profile preview"
                className="h-16 w-16 rounded-full object-cover border border-white/10 shrink-0"
              />
            ) : (
              <UserAvatar
                displayName={displayName || null}
                email={email}
                avatarUrl={null}
                size="md"
                className="shrink-0"
              />
            )}
            <div className="flex-1">
              <span className="block text-sm text-finema-muted mb-1.5">
                Profile image
                <span className="text-finema-muted/60"> (optional)</span>
              </span>
              <input
                ref={fileInputRef}
                id="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleFileChange}
                disabled={loading}
                className="block w-full text-sm text-finema-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-finema-accent file:text-white file:text-sm file:font-medium file:cursor-pointer hover:file:bg-finema-accent/90 disabled:opacity-50"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label
              htmlFor="displayName"
              className="block text-sm text-finema-muted mb-1.5"
            >
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={100}
              autoComplete="name"
              disabled={loading}
              className={inputClassName}
              placeholder="Your name"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label
              htmlFor="email"
              className="block text-sm text-finema-muted mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              className={inputClassName}
              placeholder="you@example.com"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label
              htmlFor="password"
              className="block text-sm text-finema-muted mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              disabled={loading}
              className={inputClassName}
              placeholder="••••••••"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label
              htmlFor="confirmPassword"
              className="block text-sm text-finema-muted mb-1.5"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              disabled={loading}
              className={inputClassName}
              placeholder="••••••••"
            />
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-finema-accent"
            >
              {error}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-finema-accent text-white font-semibold hover:bg-finema-accent/90 focus:outline-none focus:ring-2 focus:ring-finema-accent focus:ring-offset-2 focus:ring-offset-finema-bg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-finema-accent/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </motion.div>
        </form>

        <p className="mt-6 text-sm text-finema-muted text-center">
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="text-finema-accent hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-finema-muted">
        <Link href="/" className="hover:text-finema-text transition-colors">
          ← Back to browse
        </Link>
      </p>
    </motion.div>
  );
}
