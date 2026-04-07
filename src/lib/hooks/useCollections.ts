'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { fetchCollections } from '@/lib/assetRegistry/actions';
import type { CollectionInfo } from '@/types/assetRegistry';

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { data: CollectionInfo[]; ts: number } | null = null;

export function useCollections() {
  const { config } = useConfig();
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [collection, setCollection] = useState('');
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const skipCacheRef = useRef(false);

  useEffect(() => {
    if (!skipCacheRef.current && cache && Date.now() - cache.ts < CACHE_TTL_MS) {
      setCollections(cache.data);
      if (cache.data.length > 0) {
        const defaultColl = config.assetRegistryDefaultCollection
          ? cache.data.find((c) => c.id === config.assetRegistryDefaultCollection) ?? cache.data[0]
          : cache.data[0];
        setCollection((prev) =>
          prev && cache!.data.some((c) => c.id === prev) ? prev : defaultColl.id
        );
      }
      return;
    }
    skipCacheRef.current = false;

    setLoading(true);
    fetchCollections()
      .then((list) => {
        cache = { data: list, ts: Date.now() };
        setCollections(list);
        if (list.length > 0) {
          const defaultColl = config.assetRegistryDefaultCollection
            ? list.find((c) => c.id === config.assetRegistryDefaultCollection) ?? list[0]
            : list[0];
          setCollection((prev) =>
            prev && list.some((c) => c.id === prev) ? prev : defaultColl.id
          );
        } else {
          setCollection('');
        }
      })
      .finally(() => setLoading(false));
  }, [config, reloadKey]);

  const reload = useCallback(() => {
    skipCacheRef.current = true;
    setReloadKey((k) => k + 1);
  }, []);

  return { collections, collection, setCollection, loading, reload };
}
