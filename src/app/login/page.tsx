"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, error, clearError, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    clearError();
    setIsLoading(true);

    const success = await login(email, password);
    
    if (success) {
      router.push("/");
    }
    
    setIsLoading(false);
  };

  return (
    <main className="text-center mx-auto px-2 max-w-md">
      <section className="mt-8">
        <div className="flex justify-center items-center mb-6 relative w-full">
          <Link 
            href="/" 
            className="absolute left-0 text-gray-400 hover:text-gray-300"
            aria-label="Back to home"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </Link>
          <img src="/whisp_logo.svg" alt="Whisp Logo" className="h-36" />
        </div>
        <h1 className="text-3xl font-semibold my-8">Login</h1>
        
        {submitted && error && (
          <div className="mb-6 p-3 bg-[#2B2538] border border-red-500 rounded-lg flex items-center gap-2 text-left max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-500">{error}</span>
            <button 
              onClick={clearError} 
              className="ml-auto text-gray-400 hover:text-gray-200"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 011.414 0L10 8.586l4.293-4.293a1 1 011.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 010-1.414z" clipRule="evenodd" />
            </svg>
            </button>
          </div>
        )}

        <form onSubmit={handleLogin} className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="mb-4 flex flex-col items-start">
            <label htmlFor="email" className="text-sm text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) clearError();
              }}
              className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4 flex flex-col items-start">
            <label htmlFor="password" className="text-sm text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) clearError();
              }}
              className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 ${
              isLoading ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
          <div className="mt-3 text-right">
            <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
              Forgot your password?
            </Link>
          </div>
        </form>
      </section>
      <section className="mt-8">
        <p className="text-lg text-gray-400">
          Don&apos;t have an account?{' '}
          <a 
            href="/register" 
            className="text-[#3B82F6] hover:underline"
          >
            Register here
          </a>{' '}to get started.
        </p>
      </section>
    </main>
  );
};

export default LoginPage;