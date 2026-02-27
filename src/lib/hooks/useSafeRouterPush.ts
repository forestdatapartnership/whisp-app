import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function useSafeRouterPush() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const safePush = (url: string) => {
    if (isMounted) {
      router.push(url);
    } else {
      console.warn(`Navigation attempted after component unmounted: ${url}`);
    }
  };

  return safePush;
}
