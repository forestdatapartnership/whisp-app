"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const VerifyEmailPage: React.FC = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");
        
        if (!token) {
          setStatus("error");
          setMessage("Verification token is missing");
          return;
        }

        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Your email has been successfully verified!");
        } else {
          setStatus("error");
          setMessage(data.error || "Email verification failed");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "An error occurred during email verification");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <main className="text-center mx-auto px-2 max-w-3xl">
      <section className="mt-8">
        <div className="flex justify-center mb-6">
          <img src="/whisp_logo.svg" alt="Whisp Logo" className="h-36" />
        </div>
        <h1 className="text-3xl font-semibold my-8">Email Verification</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
          {status === "loading" && (
            <div className="flex flex-col items-center py-4">
              <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin mb-4"></div>
              <p className="text-gray-300">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center py-4">
              <div className="bg-green-100 text-green-800 rounded-full p-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-200 text-lg font-semibold mb-2">Email Verified!</p>
              <p className="text-gray-300 mb-6">{message}</p>
              <p className="text-gray-300 mb-6">You can now log in with your email and password.</p>
              <Link 
                href="/login"
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 block text-center"
              >
                Go to Login
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-4">
              <div className="bg-red-100 text-red-800 rounded-full p-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-200 text-lg font-semibold mb-2">Verification Failed</p>
              <p className="text-gray-300 mb-6">{message}</p>
              <p className="text-gray-300 mb-6">Please try again or contact support if the problem persists.</p>
              <Link 
                href="/login"
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 block text-center"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </section>
      <section className="mt-8">
        <p className="text-lg text-gray-400">
          Need help?{' '}
          <Link 
            href="/" 
            className="text-[#3B82F6] hover:underline"
          >
            Contact support
          </Link>
        </p>
      </section>
    </main>
  );
};

export default VerifyEmailPage;