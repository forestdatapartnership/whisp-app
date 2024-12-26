'use client'

import { useStore } from '@/store';
import SubmitGeometry from '@/components/SubmitGeometry';

export default function Home() {

  const resetStore = useStore((state) => state.reset);

  return (
    <main className="text-center mx-auto px-2 max-w-3xl">
      <h1 className="text-3xl font-semibold mt-8">Welcome to Whisp</h1>
      <section className="mt-8">
        <p className="text-lg text-gray-400">
          Welcome to WHISP, a Geo Spatial analysis tool designed to aid in zero-deforestation regulation claims. Upload your WKT or geojson to our API to receive a plot or o point based analysis built from carefully selected layers process via Google Earth Engine.
        </p>
      </section>
      <div className='my-8'>
        <SubmitGeometry />
      </div>
    </main>
  );
}
