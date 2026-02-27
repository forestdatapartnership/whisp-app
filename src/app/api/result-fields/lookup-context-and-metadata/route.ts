import { NextRequest, NextResponse } from 'next/server';
import { getAllResultFields } from '@/lib/dal/resultFieldsService';
import { getAllCommodities } from '@/lib/dal/commoditiesService';
import { buildWhispCsv, isContextField } from '@/lib/utils/whispLookupCsv';
import { withLogging } from '@/lib/api-middleware/withLogging';
import { withErrorHandling } from '@/lib/api-middleware/withErrorHandling';
import { compose } from '@/lib/api-middleware/compose';
import { LogFunction } from '@/lib/logger';

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (_req: NextRequest, _log: LogFunction): Promise<NextResponse> => {
  const [fields, commodities] = await Promise.all([getAllResultFields(), getAllCommodities()]);
  const csv = buildWhispCsv(fields, commodities, isContextField);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="lookup_context_and_metadata.csv"`,
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
});
