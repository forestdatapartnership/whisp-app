import { apiFetch } from '@/lib/server/api-client';

const ENDPOINTS = new Set(['wkt', 'geojson', 'geo-ids']);

export async function POST(req: Request, { params }: { params: Promise<{ endpoint: string }> }) {
  const { endpoint } = await params;
  if (!ENDPOINTS.has(endpoint)) {
    return new Response(null, { status: 404 });
  }

  const body = await req.text();
  const agent = req.headers.get('x-whisp-agent');
  const res = await apiFetch(`/submit/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(agent ? { 'X-Whisp-Agent': agent } : {}) },
    body: body || undefined,
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
