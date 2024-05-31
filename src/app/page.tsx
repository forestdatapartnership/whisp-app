'use client'

import Link from 'next/link'
import { useStore } from '@/store';

export default function Home() {

  const resetStore = useStore((state) => state.reset);

  return (
    <main className="text-center mx-auto px-2 max-w-3xl">
      <h1 className="text-3xl font-semibold mt-8">Welcome to Whisp</h1>
      <section className="mt-8">
        <p className="text-lg text-gray-400">
          Welcome to WHISP, a Geo Spatial analysis tool designed to aid in zero-deforestation regulation claims.
          Utilize our platform to analyze your plots and obtain data from a variety of layers. Geometries can be provided
          through Geoids from AgStack as well as Well-Known-Text (WKT) as well as with the Geojson standard.
        </p>
      </section>
      <h1 className="text-3xl font-semibold my-6">Choose your Format</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 my-10 mx-4">
        <Link href="/submit-geo-ids" onClick={() => resetStore()} className="block p-6 border rounded-lg shadow bg-gray-800 border-gray-700">
          <h5 className="mb-2 text-1xl font-bold tracking-tight text-white">Upload Geo IDs</h5>
          <p className="mb-3 font-normal text-gray-400">If you have a Geo ID from the Asset Registry, you can get an analysis that way.</p>
        </Link>
        <Link href="/submit-geometry" onClick={() => resetStore()} className="block p-6 border  rounded-lg shadow bg-gray-800 border-gray-700">
          <h5 className="mb-2 text-1xl font-bold tracking-tight text-white">Send Geometry</h5>
          <p className="mb-3 font-normal text-gray-400">Submit your WKT or Geojson and get your plots analyzed.</p>
        </Link>
      </div>
    </main>
  );
}
