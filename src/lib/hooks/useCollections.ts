'use client'

import { useEffect, useMemo, useState } from 'react';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { getAssetRegistryDefaultCatalog, getAssetRegistryDefaultCollection } from '@/lib/utils/configUtils';
import { fetchCollections } from '@/lib/assetRegistry/actions';
import type { CollectionInfo } from '@/types/assetRegistry';

export function useCollections() {
  const { config } = useConfig();
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [collection, setCollection] = useState('');
  const [loading, setLoading] = useState(false);

  const catalog = useMemo(
    () => getAssetRegistryDefaultCatalog(config) ?? 'geoid',
    [config]
  );

  useEffect(() => {
    setLoading(true);
    fetchCollections(catalog)
      .then((list) => {
        setCollections(list);
        if (list.length > 0) {
          const defaultId = getAssetRegistryDefaultCollection(config);
          const defaultColl = defaultId
            ? list.find((c) => c.id === defaultId) ?? list[0]
            : list[0];
          setCollection((prev) =>
            prev && list.some((c) => c.id === prev) ? prev : defaultColl.id
          );
        } else {
          setCollection('');
        }
      })
      .finally(() => setLoading(false));
  }, [catalog, config]);

  return { collections, collection, setCollection, loading, catalog };
}
