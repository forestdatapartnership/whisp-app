import { apiFetch } from '@/lib/server/api-client';

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await apiFetch(`/status/${token}/cancel`, { method: 'POST' });
  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
