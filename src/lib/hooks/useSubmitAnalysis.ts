'use client'

import { useStore } from '@/store';
import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import { useSafeRouterPush } from '@/lib/hooks/useSafeRouterPush';
import { SystemCode } from '@/types/systemCodes';
import { AnalysisOptionsValue } from '@/components/submission/AnalysisOptions';

function createApiHeaders(apiKey?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Whisp-Agent': 'ui'
  };
  if (apiKey) {
    headers['X-API-KEY'] = apiKey;
  }
  return headers;
}

export function setSubmissionError(message: string, cause?: string | null) {
  useStore.setState({
    error: message,
    errorCause: cause ?? null,
  });
}

export function clearSubmissionError() {
  useStore.setState({ error: '', errorCause: null });
}

interface SubmitWktPayload {
  type: 'wkt';
  wkt: string;
}

interface SubmitGeojsonPayload {
  type: 'json';
  geojson: any;
}

interface SubmitGeoIdsPayload {
  type: 'geo-ids';
  geoIds: string[];
  assetRegistryOptions?: Record<string, string>;
}

export type SubmitPayload = SubmitWktPayload | SubmitGeojsonPayload | SubmitGeoIdsPayload;

interface UseSubmitAnalysisOpts {
  asyncThreshold: number;
  analysisOptions: AnalysisOptionsValue;
  featureCount: number;
}

export function useSubmitAnalysis({ asyncThreshold, analysisOptions, featureCount }: UseSubmitAnalysisOpts) {
  const { apiKey } = useApiKey();
  const safePush = useSafeRouterPush();
  const resetStore = useStore((s) => s.reset);

  const submit = async (payload: SubmitPayload) => {
    useStore.setState({ isLoading: true, error: '', errorCause: null, featureCount });

    try {
      if (!apiKey) {
        throw new Error('Failed to get API key for authentication');
      }

      const shouldUseAsync = featureCount > asyncThreshold;
      const mergedOptions = { ...analysisOptions, async: shouldUseAsync };
      const headers = createApiHeaders(apiKey);
      const apiBasePath = '/api/submit';

      let endpoint: string;
      let body: any;

      switch (payload.type) {
        case 'wkt':
          endpoint = `${apiBasePath}/wkt`;
          body = { wkt: payload.wkt, analysisOptions: mergedOptions };
          break;
        case 'json':
          endpoint = `${apiBasePath}/geojson`;
          body = { ...payload.geojson, analysisOptions: mergedOptions };
          break;
        case 'geo-ids':
          endpoint = `${apiBasePath}/geo-ids`;
          body = {
            geoIds: payload.geoIds,
            analysisOptions: mergedOptions,
            ...(payload.assetRegistryOptions && { assetRegistryOptions: payload.assetRegistryOptions }),
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const cause = typeof data.cause === 'string' ? data.cause : null;
        setSubmissionError(data.message ?? `Server error with status ${response.status}`, cause);
        return;
      }

      if (!data) {
        throw new Error('No response from the server');
      }

      resetStore();

      if (data.code === SystemCode.ANALYSIS_PROCESSING) {
        const { token } = data.data;
        useStore.setState({ token });
        safePush(`/results/${token}`);
      } else if (data.code === SystemCode.ANALYSIS_COMPLETED) {
        const token = data.context?.token;
        if (token) {
          useStore.setState({ token, response: data });
          safePush(`/results/${token}`);
        }
      }
    } catch (error: any) {
      setSubmissionError(error.message);
    } finally {
      useStore.setState({ isLoading: false });
    }
  };

  return submit;
}
