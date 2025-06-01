"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Alert from "@/components/Alert";

// Component to handle the search params with suspense
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setTokenError('Invalid or missing reset token. Please request a new password reset link.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");

    // Password validation
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (!token) {
      setTokenError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
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
                d="M9.707 16.707a1 1 01-1.414 0l-6-6a1 1 010-1.414l6-6a1 1 011.414 1.414L5.414 9H17a1 1110 2H5.414l4.293 4.293a1 1010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </Link>
          <img src="/whisp_logo.svg" alt="Whisp Logo" className="h-36" />
        </div>
        <h1 className="text-3xl font-semibold my-8">Reset Password</h1>
        
        {tokenError ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
            <Alert 
              type="error"
              message={tokenError}
            />
            <Link 
              href="/forgot-password" 
              className="block w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Request New Reset Link
            </Link>
          </div>
        ) : isSubmitSuccessful ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-green-100 text-green-800 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Success!</h2>
            <p className="text-gray-400 mb-4">
              Your password has been reset successfully.
            </p>
            <p className="text-gray-400 mb-6">
              You can now log in with your new password.
            </p>
            <Link 
              href="/login" 
              className="block w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-6">
              Enter a new password for your account.
            </p>
            
            {submitted && error && (
              <Alert
                type="error"
                message={error}
                onClose={() => setError("")}
              />
            )}
            
            <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
              <div className="mb-4 flex flex-col items-start">
                <label htmlFor="newPassword" className="text-sm text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4 flex flex-col items-start">
                <label htmlFor="confirmPassword" className="text-sm text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6 text-left">
                <p className="text-sm text-gray-400 mb-2">Your password must:</p>
                <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1">
                  <li>Be at least 8 characters long</li>
                  <li>Include at least one uppercase letter (A-Z)</li>
                  <li>Include at least one lowercase letter (a-z)</li>
                  <li>Include at least one number (0-9)</li>
                  <li>Include at least one special character (!@#$...)</li>
                </ul>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Reset Password
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
}

// Loading fallback for suspense
function ResetPasswordFallback() {
  return (
    <main className="text-center mx-auto px-2 max-w-md">
      <section className="mt-8">
        <div className="flex justify-center items-center mb-6 relative w-full">
          <img src="/whisp_logo.svg" alt="Whisp Logo" className="h-36" />
        </div>
        <h1 className="text-3xl font-semibold my-8">Reset Password</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto text-center">
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </section>
    </main>
  );
}

// Main component with suspense boundary
const ResetPasswordPage: React.FC = () => {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage;