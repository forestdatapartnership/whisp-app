'use client'

import { useStore } from '@/store';
import SubmitGeometry from '@/components/SubmitGeometry';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseCookies } from 'nookies';

export default function Home() {
  const resetStore = useStore((state) => state.reset);
  const router = useRouter();

  useEffect(() => {
    // Check if token exists in cookies
    const cookies = parseCookies();
    if (cookies.token) {
      // Redirect to dashboard if authenticated
      router.push('/dashboard');
    }
  }, [router]);

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
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-blue-500 text-white font-bold rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
          <button
            onClick={() => window.location.href = '/register'}
            className="px-6 py-3 bg-green-500 text-white font-bold rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Register
          </button>
        </div>
      </section>
      <div className='my-8'>
        <SubmitGeometry />
      </div>

      <section className="mt-8">
        <p className="text-lg text-gray-400 italic">
          Make sure that the geometries are in WGS84 Coordinate Reference System (EPSG code: 4326) and that your file does not contain entries without coordinates to avoid errors.
        </p>
      </section>
    </main>
  );
}
