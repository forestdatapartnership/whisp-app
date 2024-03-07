'use client'

import Link from 'next/link'
import { useStore } from '@/store';

export default function Home() {

  const resetStore = useStore((state) => state.reset);

  return (
    <main className="text-center">
      <h1 className="text-3xl font-semibold my-8">Choose your Format</h1>
      <div className="flex justify-center gap-10 mt-10">
        <Link href="/submit-geo-ids" onClick={() => resetStore()} className="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
          <h5 className="mb-2 text-1xl font-bold tracking-tight text-gray-900 dark:text-white">Upload Geo IDs</h5>
          <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">If you have a Geo ID from the Asset Registry, you can get an analysis that way.</p>
        </Link>
        <Link href="/submit-geometry" onClick={() => resetStore()} className="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
          <h5 className="mb-2 text-1xl font-bold tracking-tight text-gray-900 dark:text-white">Send Geometry</h5>
          <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">Submit your WKT text and receive the results of the analysis from that.</p>
        </Link>
      </div>
    </main>
  );
}
