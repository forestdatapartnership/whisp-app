import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react'; // Import useEffect for cleanup

export function useSafeRouterPush() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    console.log(isMounted)
    setIsMounted(true); // Set to true when mounted
    return () => setIsMounted(false); // Set to false when unmounted

  }, []);

  const safePush = (url: string) => {
    console.log("safepush")
    if (isMounted) { // Only push if mounted
      router.push(url);
    } else {
      console.warn(`Navigation attempted after component unmounted: ${url}`);
      // Or handle this case differently, e.g., by storing the URL for later use
    }
  };

  return safePush;
}