import { NextRequest, NextResponse } from 'next/server';
import { getAllResultFields } from '@/lib/dal/resultFieldsService';
import { getAllCommodities } from '@/lib/dal/commoditiesService';
import { buildWhispCsv, isGeeField } from '@/lib/utils/whispLookupCsv';
import type { ResultField } from '@/types/models';
import { withLogging } from '@/lib/hooks/withLogging';
import { withErrorHandling } from '@/lib/hooks/withErrorHandling';
import { compose } from '@/lib/utils/compose';
import { LogFunction } from '@/lib/logger';

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (_req: NextRequest, _log: LogFunction): Promise<NextResponse> => {
  const [fields, commodities] = await Promise.all([getAllResultFields(), getAllCommodities()]);
  const geeFilter = (f: ResultField) =>
    isGeeField(f) && f.category !== 'Analysis results';
  const csv = buildWhispCsv(fields, commodities, geeFilter);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="lookup_gee_datasets.csv"`,
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
});
