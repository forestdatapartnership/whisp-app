"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "@/components/Alert";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setIsSubmitSuccessful(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="text-center mx-auto px-2 max-w-md">
      <section className="mt-8">
        <div className="flex justify-center items-center mb-6 relative w-full">
          <Link 
            href="/login" 
            className="absolute left-0 text-gray-400 hover:text-gray-300"
            aria-label="Back to login"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 011.414 1.414L5.414 9H17a1 1 110 2H5.414l4.293 4.293a1 1 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </Link>
          <img src="/whisp_logo.svg" alt="Whisp Logo" className="h-36" />
        </div>
        <h1 className="text-3xl font-semibold my-8">Forgot Password</h1>
        
        {submitted && error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {isSubmitSuccessful ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-green-100 text-green-800 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Email Sent</h2>
            <p className="text-gray-400 mb-4">
              If your email is registered, you'll receive a password reset link shortly.
            </p>
            <p className="text-gray-400 mb-6">
              Remember to check your spam folder if you don't see it in your inbox.
            </p>
            <Link 
              href="/login" 
              className="block w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
              <div className="mb-4 flex flex-col items-start">
                <label htmlFor="email" className="text-sm text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Send Reset Link
              </button>
              <div className="mt-4 text-center">
                <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                  Back to login
                </Link>
              </div>
            </form>
          </>
        )}
      </section>
    </main>
  );
};

export default ForgotPasswordPage;