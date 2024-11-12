'use client'

import Link from 'next/link'
import { useStore } from '@/store';
import { UploadIcon } from '@radix-ui/react-icons';

export default function Home() {

  const resetStore = useStore((state) => state.reset);

  return (
    <main className="text-center mx-auto px-2 max-w-3xl">
      <h1 className="text-3xl font-semibold mt-8">Welcome to Whisp</h1>
      <section className="mt-8">
        <p className="text-lg text-gray-400">
          Welcome to WHISP, a Geo Spatial analysis tool designed to aid in zero-deforestation regulation claims.
          Utilize our platform to analyze your plots and obtain data from a variety of layers. Geometries can be provided
          as Well-Known-Text (WKT) as well as with the Geojson standard.
        </p>
      </section>
      <div className="flex flex-col items-center my-8">
        <Link
          href="/submit-geometry"
          onClick={() => resetStore()}
          className="flex items-center justify-center p-8 w-80 rounded-lg shadow-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          <UploadIcon className="text-white mr-4 w-6 h-6" />
          <div>
            <h5 className="text-2xl font-bold">Send Geometry</h5>
            <p className="text-gray-200 mt-2">Submit WKT or GeoJSON for analysis</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
