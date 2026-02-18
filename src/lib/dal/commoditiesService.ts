import { getPool } from '@/lib/db';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';
import type { Commodity } from '@/types/models';
import { BaseCrudService } from './baseCrudService';

const RETURNING_FIELDS = `
  code,
  description,
  created_at as "createdAt",
  created_by as "createdBy",
  updated_at as "updatedAt",
  updated_by as "updatedBy"
`;

class CommoditiesService extends BaseCrudService<Commodity> {
  readonly tableName = 'commodities';
  readonly cacheKey = 'commodities_all';
  readonly idColumn = 'code';

  getReturningFields(): string {
    return RETURNING_FIELDS;
  }

  getOrderBy(): string {
    return 'code';
  }

  override async create(data: unknown): Promise<Commodity> {
    const { commodity, createdBy } = data as {
      commodity: Omit<Commodity, 'updatedAt' | 'updatedBy'>;
      createdBy: string;
    };
    const pool = getPool();

    const existing = await pool.query('SELECT 1 FROM commodities WHERE code = $1', [commodity.code]);
    if (existing.rows.length > 0) {
      throw new SystemError(SystemCode.COMMODITIES_DUPLICATE_CODE);
    }

    try {
      const result = await pool.query(
        `INSERT INTO commodities (code, description, created_by, updated_by)
         VALUES ($1, $2, $3, $4)
         RETURNING ${RETURNING_FIELDS}`,
        [commodity.code, commodity.description ?? null, createdBy, createdBy]
      );
      this.invalidateCache();
      return result.rows[0];
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23505') {
        throw new SystemError(SystemCode.COMMODITIES_DUPLICATE_CODE);
      }
      throw error;
    }
  }

  override async update(id: string, data: unknown): Promise<Commodity | null> {
    const { updates, updatedBy } = data as { updates: Partial<Pick<Commodity, 'description'>>; updatedBy: string };
    const pool = getPool();
    if (updates.description === undefined) return this.getById(id);

    const result = await pool.query(
      `UPDATE commodities SET description = $1, updated_by = $2 WHERE code = $3 RETURNING ${RETURNING_FIELDS}`,
      [updates.description, updatedBy, id]
    );
    this.invalidateCache();
    return result.rows[0] ?? null;
  }
}

const service = new CommoditiesService();

export const getAllCommodities = () => service.getAll();
export const getCommodity = (code: string) => service.getById(code);
export const createCommodity = (commodity: Omit<Commodity, 'updatedAt' | 'updatedBy'>, createdBy: string) =>
  service.create({ commodity, createdBy });
export const updateCommodity = (code: string, updates: Partial<Pick<Commodity, 'description'>>, updatedBy: string) =>
  service.update(code, { updates, updatedBy });
export const deleteCommodity = (code: string) => service.delete(code);
export const invalidateCache = () => service.invalidateCache();
