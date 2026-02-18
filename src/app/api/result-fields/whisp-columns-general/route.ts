import { NextRequest, NextResponse } from 'next/server';
import { getAllResultFields } from '@/lib/dal/resultFieldsService';
import { buildWhispColumnsCsv } from '@/lib/utils/whispColumnsCsv';
import type { ResultField } from '@/types/models';
import { withLogging } from '@/lib/hooks/withLogging';
import { withErrorHandling } from '@/lib/hooks/withErrorHandling';
import { compose } from '@/lib/utils/compose';
import { LogFunction } from '@/lib/logger';

export const GET = compose(
  withLogging,
  withErrorHandling
)(async (_req: NextRequest, _log: LogFunction): Promise<NextResponse> => {
  const fields = await getAllResultFields();
  const filter = (f: ResultField) => !f.iso2Code;
  const csv = buildWhispColumnsCsv(fields, filter, false);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="whisp_columns_general.csv"`,
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
});
