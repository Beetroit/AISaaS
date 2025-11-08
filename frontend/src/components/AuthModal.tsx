"use client";

import React, { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true); // State to toggle between login and register

  if (!isOpen) return null;

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
              <form id="login-form" className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="sr-only">
                    Email
                  </label>
                  <input
                    type="email"
                    id="login-email"
                    placeholder="Email"
                    required
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-150"
                >
                  Login
                </button>
              </form>
              <p className="text-center text-sm text-gray-600 mt-4">
                Don't have an account?
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
              <form id="register-form" className="space-y-4">
                <div>
                  <label htmlFor="register-email" className="sr-only">
                    Email
                  </label>
                  <input
                    type="email"
                    id="register-email"
                    placeholder="Email"
                    required
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition duration-150"
                >
                  Register
                </button>
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
