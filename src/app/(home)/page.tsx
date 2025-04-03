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
