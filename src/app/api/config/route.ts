import { NextResponse } from 'next/server';

export async function GET() {
  // Dynamically collect all NEXT_PUBLIC_* environment variables except Google Maps API key
  const publicConfig = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => 
      key.startsWith('NEXT_PUBLIC_') && key !== 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
    )
  );

  return NextResponse.json(publicConfig);
}
