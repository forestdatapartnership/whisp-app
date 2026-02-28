import { getPool } from '@/lib/dal/db';
import type { BaseModel } from '@/types/models';
import { type ColumnDefinition, type ColumnMapping, isWritable, buildReturningFields } from './mappings/columnMapping';
import { SystemCode } from '@/types/systemCodes';
import { SystemError } from '@/types/systemError';

export abstract class BaseCrudService<
  T extends BaseModel,
  M extends Partial<ColumnMapping<T>> = ColumnMapping<T>
> {
  protected abstract readonly tableName: string;
  protected abstract readonly columnsMapping: M;
  protected abstract readonly defaultOrderBy: string;
  protected readonly idColumn: string = 'id';
  protected readonly onDuplicateError?: SystemCode;

  private _returningFields?: string;
  private _columnEntries?: [string, ColumnDefinition][];

  protected get returningFields(): string {
    return (this._returningFields ??= buildReturningFields(this.columnsMapping as ColumnMapping<T>));
  }

  private get columnEntries(): [string, ColumnDefinition][] {
    return (this._columnEntries ??= Object.entries(this.columnsMapping) as [string, ColumnDefinition][]);
  }

  private static resolvePath(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>(
      (acc, key) => acc != null && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
      obj
    );
  }

  private resolveWritableColumns(data: Partial<T>, startIndex: number = 1) {
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: unknown[] = [];
    let i = startIndex;
    const row = data as Record<string, unknown>;

    for (const [property, column] of this.columnEntries) {
      if (!isWritable(column)) continue;
      const value = column.path ? BaseCrudService.resolvePath(row, column.path) : row[property];
      if (value === undefined) continue;
      columns.push(column.name);
      placeholders.push(column.jsonb ? `$${i}::jsonb` : `$${i}`);
      values.push(column.jsonb ? JSON.stringify(value) : value);
      i++;
    }

    return { columns, placeholders, values };
  }

  async getAll(): Promise<T[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT ${this.returningFields} FROM ${this.tableName} ORDER BY ${this.defaultOrderBy}`
    );
    return result.rows;
  }

  async getById(id: string): Promise<T | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT ${this.returningFields} FROM ${this.tableName} WHERE ${this.idColumn} = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async create(data: Partial<T>): Promise<T> {
    const { columns, placeholders, values } = this.resolveWritableColumns(data);

    const pool = getPool();
    try {
      const result = await pool.query(
        `INSERT INTO ${this.tableName} (${columns.join(', ')})
         VALUES (${placeholders.join(', ')})
         RETURNING ${this.returningFields}`,
        values
      );
      return result.rows[0];
    } catch (e: unknown) {
      if (this.onDuplicateError && (e as { code?: string }).code === '23505')
        throw new SystemError(this.onDuplicateError);
      throw e;
    }
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const { columns, placeholders, values } = this.resolveWritableColumns(data, 2);

    if (!columns.length) return null;

    const sets = columns.map((col, idx) => `${col} = ${placeholders[idx]}`);
    const pool = getPool();
    const result = await pool.query(
      `UPDATE ${this.tableName} SET ${sets.join(', ')} WHERE ${this.idColumn} = $1 RETURNING ${this.returningFields}`,
      [id, ...values]
    );
    return result.rows[0] ?? null;
  }

  async delete(id: string): Promise<void> {
    const pool = getPool();
    await pool.query(`DELETE FROM ${this.tableName} WHERE ${this.idColumn} = $1`, [id]);
  }
}
