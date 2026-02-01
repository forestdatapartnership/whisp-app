import { getPool } from '@/lib/db';
import NodeCache from 'node-cache';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';

const CACHE_KEY = 'result_columns_all';
const CACHE_TTL = 300;

const cache = new NodeCache({ stdTTL: CACHE_TTL });

const RETURNING_FIELDS = `
  column_name as "columnName",
  type,
  unit,
  description,
  period,
  source,
  dashboard,
  crop_metadata as "cropMetadata",
  comments,
  updated_at as "updatedAt",
  updated_by as "updatedBy"
`;

export interface CropMetadata {
  used_for_risk?: string;
  data_theme?: string;
}

export interface CropMetadataMap {
  pcrop?: CropMetadata;
  acrop?: CropMetadata;
  timber?: CropMetadata;
  [key: string]: CropMetadata | undefined;
}

export interface ResultColumn {
  columnName: string;
  type?: string;
  unit?: string;
  description?: string;
  period?: string;
  source?: string;
  dashboard?: string;
  cropMetadata?: CropMetadataMap;
  comments?: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export async function getAllResultColumns(): Promise<Record<string, ResultColumn>> {
  const cached = cache.get<Record<string, ResultColumn>>(CACHE_KEY);
  if (cached) return cached;

  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT ${RETURNING_FIELDS}
      FROM result_columns
      ORDER BY column_name
    `);

    const columns: Record<string, ResultColumn> = {};
    result.rows.forEach(row => {
      columns[row.columnName] = row;
    });

    cache.set(CACHE_KEY, columns);
    return columns;
  } catch (error) {
    console.error('Error fetching result columns:', error);
    return {};
  }
}

export async function getResultColumn(columnName: string): Promise<ResultColumn | null> {
  const all = await getAllResultColumns();
  return all[columnName] || null;
}

export async function updateResultColumn(
  columnName: string,
  updates: Partial<ResultColumn>,
  updatedBy: string
): Promise<ResultColumn> {
  const pool = getPool();
  
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  const excludedKeys = new Set(['columnName', 'updatedAt', 'updatedBy']);

  Object.entries(updates).forEach(([key, value]) => {
    if (!excludedKeys.has(key)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      
      if (key === 'cropMetadata') {
        fields.push(`${dbKey} = $${paramCount}::jsonb`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
      }
      paramCount++;
    }
  });

  fields.push(`updated_by = $${paramCount}`);
  values.push(updatedBy);
  values.push(columnName);

  const result = await pool.query(`
    UPDATE result_columns 
    SET ${fields.join(', ')}
    WHERE column_name = $${paramCount + 1}
    RETURNING ${RETURNING_FIELDS}
  `, values);

  invalidateCache();
  
  return result.rows[0];
}

export async function createResultColumn(
  column: Omit<ResultColumn, 'updatedAt' | 'updatedBy'>,
  createdBy: string
): Promise<ResultColumn> {
  const pool = getPool();
  
  const existing = await pool.query(
    'SELECT 1 FROM result_columns WHERE column_name = $1',
    [column.columnName]
  );
  
  if (existing.rows.length > 0) {
    throw new SystemError(SystemCode.RESULT_COLUMNS_DUPLICATE_NAME);
  }
  
  try {
    const result = await pool.query(`
      INSERT INTO result_columns (
        column_name, type, unit, description, period, source,
        dashboard, crop_metadata, comments, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
      RETURNING ${RETURNING_FIELDS}
    `, [
      column.columnName,
      column.type || null,
      column.unit || null,
      column.description || null,
      column.period || null,
      column.source || null,
      column.dashboard || null,
      JSON.stringify(column.cropMetadata || {}),
      column.comments || null,
      createdBy
    ]);

    invalidateCache();
    
    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') {
      throw new SystemError(SystemCode.RESULT_COLUMNS_DUPLICATE_NAME);
    }
    throw error;
  }
}

export async function deleteResultColumn(columnName: string): Promise<void> {
  const pool = getPool();
  
  await pool.query(`
    DELETE FROM result_columns 
    WHERE column_name = $1
  `, [columnName]);

  invalidateCache();
}

export function invalidateCache(): void {
  cache.del(CACHE_KEY);
}
