import { getPool } from '@/lib/db';
import type { BaseModel } from '@/types/models';

export abstract class BaseCrudService<T extends BaseModel> {
  abstract readonly tableName: string;
  abstract readonly idColumn: string;
  abstract getReturningFields(): string;
  abstract getOrderBy(): string;

  async getAll(): Promise<T[]> {
    const pool = getPool();
    try {
      const result = await pool.query(`
        SELECT ${this.getReturningFields()}
        FROM ${this.tableName}
        ORDER BY ${this.getOrderBy()}
      `);
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
  }

  abstract create(data: unknown): Promise<T>;
  abstract update(id: string, data: unknown): Promise<T | null>;
}
