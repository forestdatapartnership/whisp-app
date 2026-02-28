export type ColumnDefinition = {
  name:         string;
  readonly?:    boolean;  // DB-managed (e.g. createdAt, updatedAt) — never written by app
  jsonb?:       boolean;
  path?:        string;   // dot-notation path into the data object, e.g. "apiKey.keyId"
};

export type ColumnMapping<T> = { [K in keyof Required<T>]: ColumnDefinition };

export const isWritable = (column: ColumnDefinition): boolean => !column.readonly;

/**
 * Builds the SQL RETURNING / SELECT field list.
 * An alias (`col AS "prop"`) is emitted when the SQL column name differs from the
 * TypeScript property name — i.e. snake_case column ≠ camelCase property.
 */
export function buildReturningFields<T>(meta: ColumnMapping<T>): string {
  return (Object.entries(meta) as [string, ColumnDefinition][])
    .map(([property, { name }]) => (name === property ? name : `${name} as "${property}"`))
    .join(',');
}
