import { getPool } from '@/lib/db';
import NodeCache from 'node-cache';
import type { BaseModel } from '@/types/models';

const CACHE_TTL = 300;

export abstract class BaseCrudService<T extends BaseModel> {
  protected readonly cache = new NodeCache({ stdTTL: CACHE_TTL });

  abstract readonly tableName: string;
  abstract readonly cacheKey: string;
  abstract readonly idColumn: string;
  abstract getReturningFields(): string;
  abstract getOrderBy(): string;

  async getAll(): Promise<T[]> {
    const cached = this.cache.get<T[]>(this.cacheKey);
    if (cached) return cached;

    const pool = getPool();
    try {
      const result = await pool.query(`
        SELECT ${this.getReturningFields()}
        FROM ${this.tableName}
        ORDER BY ${this.getOrderBy()}
      `);

      this.cache.set(this.cacheKey, result.rows);
      return result.rows;
    } catch (error) {
      console.error(`Error fetching ${this.tableName}:`, error);
      return [];
    }
  }

  async getById(id: string): Promise<T | null> {
    const pool = getPool();
    try {
      const result = await pool.query(
        `SELECT ${this.getReturningFields()} FROM ${this.tableName} WHERE ${this.idColumn} = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error fetching ${this.tableName} by id:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    const pool = getPool();
    await pool.query(`DELETE FROM ${this.tableName} WHERE ${this.idColumn} = $1`, [id]);
    this.invalidateCache();
  }

  invalidateCache(): void {
    this.cache.del(this.cacheKey);
  }

  abstract create(data: unknown): Promise<T>;
  abstract update(id: string, data: unknown): Promise<T | null>;
}
