"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { useLogin, useRegister } from "../hooks/useAuth";
import { useCreateCheckoutSession } from "../hooks/useStripe"; // Import useCreateCheckoutSession
import { getPendingPurchase, clearPendingPurchase } from "../lib/utils/storage"; // Import storage utilities

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void; // New optional prop for post-login actions
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const registerEmailRef = useRef<HTMLInputElement>(null);
  const registerPasswordRef = useRef<HTMLInputElement>(null);

  const router = useRouter()
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const createCheckoutSessionMutation = useCreateCheckoutSession(); // Initialize useCreateCheckoutSession

  if (!isOpen) return null;

  const handleLoginSubmit = (event: FormEvent) => {
    event.preventDefault();
    const email = loginEmailRef.current?.value;
    const password = loginPasswordRef.current?.value;

    if (email && password) {
      loginMutation.mutate(
        { email, password },
        {
          onSuccess: () => {
            onClose();
            const pendingPurchase = getPendingPurchase();
            if (pendingPurchase) {
              clearPendingPurchase();
              // Assuming createCheckoutSessionMutation handles redirection to Stripe
              createCheckoutSessionMutation.mutate(pendingPurchase.priceId);
            } else {
              router.push("/dashboard");
            }
            if (onLoginSuccess) {
              onLoginSuccess();
            }
          },
          onError: (error) => {
            console.error("Login failed:", error.message);
            // TODO: Display user-friendly error message
          },
        }
      );
    }
  };

  const handleRegisterSubmit = (event: FormEvent) => {
    event.preventDefault();
    const email = registerEmailRef.current?.value;
    const password = registerPasswordRef.current?.value;

    if (email && password) {
      registerMutation.mutate(
        { email, password },
        {
          onSuccess: () => {
            console.log("Registration successful!");
            setIsLogin(true);
            // After successful registration, if there's a pending purchase,
            // we should ideally log them in and then process the purchase.
            // For now, we'll just switch to login. The pending purchase logic
            // will be handled after successful login.
          },
          onError: (error) => {
            console.error("Registration failed:", error.message);
            // TODO: Display user-friendly error message
          },
        }
      );
    }
  };

  return (
    <div
      id="auth-modal"
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center"
    >
      <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="text-right">
          <button
            id="close-auth-modal"
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          {isLogin ? "Login" : "Register"}
        </h2>

        <div id="auth-container">
          {isLogin ? (
            <div id="login-section">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Login</h3>
              <form id="login-form" className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label htmlFor="login-email" className="sr-only">
                    Email
                  </label>
                  <input
                    type="email"
                    id="login-email"
                    placeholder="Email"
                    required
                    ref={loginEmailRef}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="sr-only">
                    Password
                  </label>
                  <input
                    type="password"
                    id="login-password"
                    placeholder="Password"
                    required
                    ref={loginPasswordRef}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-150"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </button>
                {loginMutation.isError && (
                  <p className="text-red-500 text-sm mt-2">
                    {loginMutation.error?.message || "Login failed."}
                  </p>
                )}
              </form>
              <p className="text-center text-sm text-gray-600 mt-4">
                Don&apos;t have an account?
                <a
                  href="#"
                  id="show-register"
                  className="text-blue-600 hover:underline"
                  onClick={() => setIsLogin(false)}
                >
                  Register here
                </a>
              </p>
            </div>
          ) : (
            <div id="register-section" className="mt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Register</h3>
              <form id="register-form" className="space-y-4" onSubmit={handleRegisterSubmit}>
                <div>
                  <label htmlFor="register-email" className="sr-only">
                    Email
                  </label>
                  <input
                    type="email"
                    id="register-email"
                    placeholder="Email"
                    required
                    ref={registerEmailRef}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="register-password" className="sr-only">
                    Password
                  </label>
                  <input
                    type="password"
                    id="register-password"
                    placeholder="Password"
                    required
                    ref={registerPasswordRef}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition duration-150"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Registering..." : "Register"}
                </button>
                {registerMutation.isError && (
                  <p className="text-red-500 text-sm mt-2">
                    {registerMutation.error?.message || "Registration failed."}
                  </p>
                )}
              </form>
              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account?
                <a
                  href="#"
                  id="show-login"
                  className="text-blue-600 hover:underline"
                  onClick={() => setIsLogin(true)}
                >
                  Login here
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}