"use client";

import { useState, useEffect } from 'react';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import SubmitGeometry from '@/components/SubmitGeometry';

export default function SubmitGeometryPage() {
  const { user, isAuthenticated, loading } = useUserProfile(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      setShowContent(true);
    } else if (!loading) {
      setShowContent(true);
    }
  }, [isAuthenticated, user, loading]);

  if (!showContent) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Submit Geometry</h1>
        <p className="mt-2 text-gray-400">
          Upload your GeoJSON or WKT data for analysis
        </p>
      </div>

      {/* Use the existing SubmitGeometry component with useTempKey set to false */}
      <SubmitGeometry useTempKey={false} />
    </div>
  );
}