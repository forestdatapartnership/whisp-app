import type { Commodity } from '@/types/models';
import type { ColumnMapping } from './columnMapping';

export const commodityMapping = {
  id:          { name: 'id'                         },
  description: { name: 'description'                },
  createdAt:   { name: 'created_at', readonly: true },
  createdBy:   { name: 'created_by'                 },
  updatedAt:   { name: 'updated_at', readonly: true },
  updatedBy:   { name: 'updated_by'                 },
} satisfies ColumnMapping<Commodity>;
