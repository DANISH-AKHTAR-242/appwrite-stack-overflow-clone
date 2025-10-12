"use client";

import React from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { useAuthStore } from "../../../store/Auth";
import Link from "next/link";

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};

export default function Login() {
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
      setError(() => "Please fill out all fields");
      return;
    }

    setIsLoading(() => true);
    setError(() => "");

    const loginResponse = await login(email.toString(), password.toString());
    if (loginResponse.error) {
      setError(() => loginResponse.error!.message);
    }

    setIsLoading(() => false);
  };

  return (
    /* The main "glass" card container */
    <div className="mx-auto w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
      {/* Header Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Login to Riverflow</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-300">
          Welcome back! Don't have an account yet?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-400 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>

      {/* Display Error Message */}
      {error && (
        <p className="mt-4 text-center text-sm font-medium text-red-400">
          {error}
        </p>
      )}

      {/* Form */}
      <form className="mt-8" onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-4">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              placeholder="projectmayhem@fc.com"
              type="email"
              className="block w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-white transition-all outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              className="block w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-white transition-all outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
            />
          </div>

          {/* Log in Button */}
          <button
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            type="submit"
            disabled={isLoading}
          >
            Log in
          </button>

          {/* Divider */}
          <div className="my-4 flex items-center gap-x-3">
            <hr className="flex-grow border-white/20" />
            <span className="text-xs text-gray-400">OR</span>
            <hr className="flex-grow border-white/20" />
          </div>

          {/* Social Login Buttons */}
          <div className="flex flex-col space-y-4">
            <button
              className="relative flex h-10 w-full items-center justify-center space-x-2 rounded-lg border border-white/30 bg-white/10 px-4 font-medium text-white transition-all hover:bg-white/20 active:scale-95 disabled:opacity-50"
              type="button"
              disabled={isLoading}
            >
              <IconBrandGoogle className="h-4 w-4" />
              <span className="text-sm">Continue with Google</span>
            </button>
            <button
              className="relative flex h-10 w-full items-center justify-center space-x-2 rounded-lg border border-white/30 bg-white/10 px-4 font-medium text-white transition-all hover:bg-white/20 active:scale-95 disabled:opacity-50"
              type="button"
              disabled={isLoading}
            >
              <IconBrandGithub className="h-4 w-4" />
              <span className="text-sm">Continue with GitHub</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
