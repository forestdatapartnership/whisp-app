import { NextRequest, NextResponse } from 'next/server';
import { compose } from "@/lib/middleware/compose";
import { withLogging } from "@/lib/middleware/withLogging";
import { LogFunction } from "@/lib/logger";

export const GET = compose(
  withLogging
)(async (req: NextRequest, log: LogFunction): Promise<NextResponse> => {
  const publicConfig = Object.fromEntries(
    Object.entries(process.env).filter(([key]) =>
      key.startsWith('NEXT_PUBLIC_') && key !== 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
    )
  );

  const assetRegistryDefaults: Record<string, string | undefined> = {};
  if (process.env.ASSET_REGISTRY_DEFAULT_CATALOG) {
    assetRegistryDefaults.ASSET_REGISTRY_DEFAULT_CATALOG = process.env.ASSET_REGISTRY_DEFAULT_CATALOG;
  }
  if (process.env.ASSET_REGISTRY_DEFAULT_COLLECTION) {
    assetRegistryDefaults.ASSET_REGISTRY_DEFAULT_COLLECTION = process.env.ASSET_REGISTRY_DEFAULT_COLLECTION;
  }

  return NextResponse.json({ ...publicConfig, ...assetRegistryDefaults });
});
