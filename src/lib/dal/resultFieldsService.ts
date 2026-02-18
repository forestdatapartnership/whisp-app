import { getPool } from '@/lib/db';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';
import type { ResultField } from '@/types/models';
import { BaseCrudService } from './baseCrudService';

const RETURNING_FIELDS = `
  code,
  type,
  unit,
  description,
  category,
  "order",
  iso2_code as "iso2Code",
  period,
  source,
  power_bi_metadata as "powerBiMetadata",
  commodity_metadata as "commodityMetadata",
  display_metadata as "displayMetadata",
  analysis_metadata as "analysisMetadata",
  comments,
  created_at as "createdAt",
  created_by as "createdBy",
  updated_at as "updatedAt",
  updated_by as "updatedBy"
`;

class ResultFieldsService extends BaseCrudService<ResultField> {
  readonly tableName = 'result_fields';
  readonly idColumn = 'code';

  getReturningFields(): string {
    return RETURNING_FIELDS;
  }

  getOrderBy(): string {
    return '"order" NULLS LAST, code';
  }

  async create(data: unknown): Promise<ResultField> {
    const { field, createdBy } = data as {
      field: Omit<ResultField, 'updatedAt' | 'updatedBy'>;
      createdBy: string;
    };
    const pool = getPool();

    const existing = await pool.query('SELECT 1 FROM result_fields WHERE code = $1', [field.code]);
    if (existing.rows.length > 0) {
      throw new SystemError(SystemCode.RESULT_FIELDS_DUPLICATE_CODE);
    }

    try {
      const result = await pool.query(
        `INSERT INTO result_fields (
          code, type, unit, description, category, "order", iso2_code, period, source,
          power_bi_metadata, commodity_metadata, display_metadata, analysis_metadata, comments, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14, $15, $16)
        RETURNING ${RETURNING_FIELDS}`,
        [
          field.code,
          field.type ?? null,
          field.unit ?? null,
          field.description ?? null,
          field.category ?? null,
          field.order ?? null,
          field.iso2Code ?? null,
          field.period ?? null,
          field.source ?? null,
          JSON.stringify(field.powerBiMetadata ?? {}),
          JSON.stringify(field.commodityMetadata ?? {}),
          JSON.stringify(field.displayMetadata ?? {}),
          JSON.stringify(field.analysisMetadata ?? {}),
          field.comments ?? null,
          createdBy,
          createdBy,
        ]
      );
      return result.rows[0];
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23505') {
        throw new SystemError(SystemCode.RESULT_FIELDS_DUPLICATE_CODE);
      }
      throw error;
    }
  }

  async update(id: string, data: unknown): Promise<ResultField | null> {
    const { updates, updatedBy } = data as { updates: Partial<ResultField>; updatedBy: string };
    const pool = getPool();
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    const excludedKeys = new Set(['code', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy']);

    for (const [key, value] of Object.entries(updates)) {
      if (excludedKeys.has(key)) continue;

      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      const quotedKey = dbKey === 'order' ? '"order"' : dbKey;

      if (['commodityMetadata', 'powerBiMetadata', 'displayMetadata', 'analysisMetadata'].includes(key)) {
        fields.push(`${quotedKey} = $${paramCount}::jsonb`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${quotedKey} = $${paramCount}`);
        values.push(value);
      }
      paramCount++;
    }

    if (fields.length === 0) return this.getById(id);

    fields.push(`updated_by = $${paramCount}`);
    values.push(updatedBy, id);

    const result = await pool.query(
      `UPDATE result_fields SET ${fields.join(', ')} WHERE code = $${paramCount + 1} RETURNING ${RETURNING_FIELDS}`,
      values
    );
    return result.rows[0] ?? null;
  }
}

const service = new ResultFieldsService();

export const getAllResultFields = () => service.getAll();
export const getResultField = (code: string) => service.getById(code);
export const createResultField = (field: Omit<ResultField, 'updatedAt' | 'updatedBy'>, createdBy: string) =>
  service.create({ field, createdBy });
export const updateResultField = (code: string, updates: Partial<ResultField>, updatedBy: string) =>
  service.update(code, { updates, updatedBy });
export const deleteResultField = (code: string) => service.delete(code);
