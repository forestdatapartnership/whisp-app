import { apiFetch } from '@/lib/server/api-client';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await apiFetch(`/status/${token}/stream`);

  if (!res.ok || !res.body) {
    return new Response(res.statusText, { status: res.status });
  }

  return new Response(res.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
