'use client'

import DataSubmission from '@/components/DataSubmission';
import Link from 'next/link';
import { useStore } from '@/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export default function Home() {
  const resetStore = useStore((state) => state.reset);
  const router = useRouter();
  const { isAuthenticated, loading } = useUserProfile(false); // Don't redirect automatically

  useEffect(() => {
    // If user is authenticated, redirect to submit-geometry page
    if (isAuthenticated && !loading) {
      router.push('/submit-geometry');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-300">Loading...</p>
      </div>
    );
  }

  // Only show the welcome page if user is not authenticated
  return (
    <main className="text-center mx-auto px-2 max-w-3xl">
      <h1 className="text-3xl font-semibold mt-8">Welcome to Whisp</h1>
      <section className="mt-8">
        <p className="text-lg text-gray-400">
          Welcome to Whisp, a geospatial analysis tool designed to support zero-deforestation regulation claims. Upload your geometries in WKT or GeoJSON format here to receive a plot- or point-based analysis from our{' '}
          <a
            href="https://whisp.openforis.org/documentation/api-guide"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3B82F6] hover:underline"
          >
            API
          </a>, calculated from carefully selected{' '}
          <a
            href="https://whisp.openforis.org/documentation/layers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3B82F6] hover:underline"
          >
            global and regional map datasets
          </a>{' '}
          processed via Google Earth Engine.
        </p>
      </section>

      <section className="mt-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Need an API key?</h2>
        <div className="flex justify-center gap-4">
          <Link href="/login">
            <button
              className="px-6 py-3 bg-blue-500 text-white font-bold rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login
            </button>
          </Link>
          <Link href="/register">
            <button
              className="px-6 py-3 bg-green-500 text-white font-bold rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Register
            </button>
          </Link>
        </div>
      </section>

      <div className='my-8'>
        <DataSubmission />
      </div>

      <section className="mt-8">
        <p className="text-lg text-gray-400 italic">
          Make sure that the geometries are in WGS84 Coordinate Reference System (EPSG code: 4326) and that your file does not contain entries without coordinates to avoid errors.
        </p>
      </section>
    </main>
  );
}
