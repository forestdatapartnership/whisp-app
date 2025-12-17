import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { sseEmitter } from "@/lib/utils/sseEmitter";
import { jobCache } from "@/lib/utils/jobCache";
import { SystemCode } from "@/types/systemCodes";
import { compose } from "@/lib/utils/compose";
import { withLogging } from "@/lib/hooks/withLogging";
import { withErrorHandling } from "@/lib/hooks/withErrorHandling";
import { withApiKey } from "@/lib/hooks/withApiKey";
import { ApiKey } from "@/types/api";
import { LogFunction } from "@/lib/logger";

async function fileExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

export const GET = compose(
  withLogging,
  withErrorHandling,
  withApiKey
)(async (request: NextRequest, apiKey: ApiKey, log: LogFunction, { params }: { params: { token: string } }) => {
  const { token } = params;
  const filePath = path.join(process.cwd(), 'temp');
  const encoder = new TextEncoder();

  const resultPath = `${filePath}/${token}-result.json`;
  const errorPath = `${filePath}/${token}-error.json`;
  const inputPath = `${filePath}/${token}.json`;

  if (await fileExists(resultPath)) {
    const data = JSON.parse(await fs.readFile(resultPath, 'utf8'));
    const body = `data: ${JSON.stringify({ code: SystemCode.ANALYSIS_COMPLETED, data, final: true })}\n\n`;
    return new NextResponse(body, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  if (await fileExists(errorPath)) {
    const errorInfo = JSON.parse(await fs.readFile(errorPath, 'utf8'));
    const body = `data: ${JSON.stringify({ code: errorInfo.code || SystemCode.ANALYSIS_ERROR, ...errorInfo, final: true })}\n\n`;
    return new NextResponse(body, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  if (!(await fileExists(inputPath))) {
    const body = `data: ${JSON.stringify({ code: SystemCode.ANALYSIS_JOB_NOT_FOUND, final: true })}\n\n`;
    return new NextResponse(body, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const metadata = jobCache.get(token);
      if (metadata) {
        send({ code: SystemCode.ANALYSIS_PROCESSING, data: metadata });
      }

      const unsubscribe = sseEmitter.subscribe(token, (data) => {
        send(data);
        if (data.final) {
          unsubscribe();
          controller.close();
        }
      });

      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

