"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const router = useRouter();

  // Add a new function for validating email
  const isValidEmail = (email: string) => {
    return email.includes('@');
  };

  // Add password validation to match backend requirements
  const isValidPassword = (password: string) => {
    // Check for minimum length
    if (password.length < 8) return false;
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) return false;
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) return false;
    
    // Check for number
    if (!/[0-9]/.test(password)) return false;
    
    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordMatchError(true);
    } else {
      setPasswordMatchError(false);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPwd = e.target.value;
    setConfirmPassword(confirmPwd);
    if (confirmPwd && password !== confirmPwd) {
      setPasswordMatchError(true);
    } else {
      setPasswordMatchError(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    setIsLoading(true);

    // Check if email is valid
    if (!isValidEmail(email)) {
      setError("Please include an '@' in the email address");
      setIsLoading(false);
      return;
    }

    // Check if password meets requirements - we'll handle this with the field-level alert
    if (!isValidPassword(password)) {
      // Don't set the general error for password validation
      // We'll display this in the field-specific alert instead
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordMatchError(true);
      // Not setting the general error anymore since we'll show this as a field-level alert
      setIsLoading(false);
      return;
    }

    // Check if user has agreed to Terms of Service
    if (!termsAgreed) {
      setError("You must agree to the Terms of Service");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, lastName, organization, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      setRegistrationSuccess(true);
      
      // Clear all form fields after successful registration
      setName("");
      setLastName("");
      setOrganization("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="text-center mx-auto px-2 max-w-3xl">
      <section className="mt-8">
        <div className="flex justify-center items-center mb-6 relative">
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
        <h1 className="text-3xl font-semibold my-8">Register</h1>
        
        {submitted && error && !registrationSuccess && (
          <div className="mb-6 p-3 bg-[#2B2538] border border-red-500 rounded-lg flex items-center gap-2 text-left max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-500">{error}</span>
            <button 
              onClick={() => setError("")} 
              className="ml-auto text-gray-400 hover:text-gray-200"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {isLoading && !registrationSuccess && (
          <div className="mb-6 p-4 bg-[#2B2538] border border-blue-500 rounded-lg flex items-center justify-center gap-3 max-w-md mx-auto">
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-blue-500 font-medium">Creating your account...</span>
          </div>
        )}

        {registrationSuccess && (
          <div className="mb-6 p-4 bg-[#121E24] border border-green-500 rounded-lg flex items-center gap-3 text-left max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-grow">
              <span className="text-sm text-green-500 block font-medium">A verification link was sent to your email.</span>
              <span className="text-xs text-green-400">Please check your inbox to verify your account.</span>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="ml-auto text-sm text-blue-400 hover:text-blue-300 underline"
            >
              Go to login
            </button>
          </div>
        )}

        <form onSubmit={handleRegister} className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm text-gray-300 mb-2 text-left">
              First Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4 flex flex-col items-start">
            <label htmlFor="lastName" className="text-sm text-gray-300 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4 flex flex-col items-start">
            <label htmlFor="organization" className="text-sm text-gray-300 mb-1">
              Organization (Optional)
            </label>
            <input
              id="organization"
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4 flex flex-col items-start relative">
            <label htmlFor="email" className="text-sm text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4 flex flex-col items-start relative">
            <label htmlFor="password" className="text-sm text-gray-300 mb-1">
              Password
            </label>
            <div className="relative w-full">
              <input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                onFocus={() => setShowPasswordTooltip(true)}
                onBlur={() => setShowPasswordTooltip(false)}
                className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {showPasswordTooltip && (
                <div className="mt-2 w-full bg-[#2B3341] border border-gray-700 rounded-lg shadow-lg p-4">
                  <div className="text-sm text-gray-300 font-medium mb-2 text-left">Password requirements:</div>
                  <ul className="list-none space-y-2 text-sm text-gray-400">
                    <li className="flex items-center">
                      <span className="mr-2 text-gray-400">•</span>
                      <span className="flex-grow text-left">At least 8 characters long</span>
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2 text-gray-400">•</span>
                      <span className="flex-grow text-left">Include at least one uppercase letter (A-Z)</span>
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2 text-gray-400">•</span>
                      <span className="flex-grow text-left">Include at least one lowercase letter (a-z)</span>
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2 text-gray-400">•</span>
                      <span className="flex-grow text-left">Include at least one number (0-9)</span>
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2 text-gray-400">•</span>
                      <span className="flex-grow text-left">Include at least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="mb-4 flex flex-col items-start">
            <label htmlFor="confirmPassword" className="text-sm text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {submitted && !isValidPassword(password) && !registrationSuccess && (
              <div className="mt-2 w-full bg-[#2B2538] border border-red-500 rounded-lg flex items-center gap-2 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-500">Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.</span>
              </div>
            )}
            {submitted && passwordMatchError && !registrationSuccess && (
              <div className="mt-2 w-full bg-[#2B2538] border border-red-500 rounded-lg flex items-center gap-2 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-500">Passwords do not match</span>
              </div>
            )}
          </div>
          <div className="mb-4 flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="terms"
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="text-gray-300 cursor-pointer">
                I agree to the{' '}
                <a href="https://openforis.org/whisp-terms-of-service" className="text-blue-400 hover:underline">
                  Terms of Service
                </a>
              </label>
            </div>
          </div>
          {submitted && !termsAgreed && !registrationSuccess && (
            <div className="mb-4 w-full bg-[#2B2538] border border-red-500 rounded-lg flex items-center gap-2 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-500">You must agree to the Terms of Service</span>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Register
          </button>
        </form>
      </section>
      <section className="my-8 pb-12">
        <p className="text-lg text-gray-400">
          Already have an account?{' '}
          <a 
            href="/login" 
            className="text-[#3B82F6] hover:underline"
          >
            Login here
          </a>{' '}to access your account.
        </p>
      </section>
    </main>
  );
};

export default RegisterPage;
