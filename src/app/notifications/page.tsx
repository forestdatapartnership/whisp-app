"use client";

import { useState } from "react";
import Link from "next/link";

const NotificationsPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "subscribe" | "unsubscribe") => {
    setMessage("");
    setLoading(true);

    if (!email.trim()) {
      setMessage("Please enter an email address");
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        method: action === "subscribe" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      setMessage(data.message || (response.ok ? "Success" : "Failed"));
      setIsError(!response.ok);
      if (response.ok) setEmail("");
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
      setIsError(true);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-semibold my-8">Email Notifications</h1>

        {loading && (
          <div className="mb-6 p-4 bg-[#2B2538] border border-blue-500 rounded-lg flex items-center justify-center gap-3 max-w-md mx-auto">
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-blue-500 font-medium">Processing...</span>
          </div>
        )}

        {message && !loading && (
          <div className={`mb-6 p-3 ${isError ? 'bg-[#2B2538] border border-red-500' : 'bg-[#2B2538] border border-green-500'} rounded-lg flex items-center gap-2 text-left max-w-md mx-auto`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isError ? 'text-red-500' : 'text-green-500'} flex-shrink-0`} viewBox="0 0 20 20" fill="currentColor">
              {isError ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              )}
            </svg>
            <span className={`text-sm ${isError ? 'text-red-500' : 'text-green-500'}`}>{message}</span>
            <button
              onClick={() => setMessage("")}
              className="ml-auto text-gray-400 hover:text-gray-200"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 011.414 0L10 8.586l4.293-4.293a1 1 011.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="mb-4 flex flex-col items-start">
            <label htmlFor="email" className="text-sm text-gray-300 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAction("subscribe")}
              disabled={loading}
              className="py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Subscribe
            </button>
            <button
              onClick={() => handleAction("unsubscribe")}
              disabled={loading}
              className="py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Unsubscribe
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default NotificationsPage;

