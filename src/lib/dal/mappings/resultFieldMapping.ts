import type { ResultField } from '@/types/models';
import type { ColumnMapping } from './columnMapping';

export const resultFieldMapping = {
  id:                { name: 'id'                                    },
  type:              { name: 'type'                                  },
  unit:              { name: 'unit'                                  },
  description:       { name: 'description'                          },
  category:          { name: 'category'                             },
  order:             { name: '"order"'                              },
  iso2Code:          { name: 'iso2_code'                            },
  period:            { name: 'period'                               },
  source:            { name: 'source'                               },
  comments:          { name: 'comments'                             },
  powerBiMetadata:   { name: 'power_bi_metadata',   jsonb: true     },
  commodityMetadata: { name: 'commodity_metadata',  jsonb: true     },
  displayMetadata:   { name: 'display_metadata',    jsonb: true     },
  analysisMetadata:  { name: 'analysis_metadata',   jsonb: true     },
  createdAt:         { name: 'created_at',          readonly: true },
  createdBy:         { name: 'created_by'                          },
  updatedAt:         { name: 'updated_at',          readonly: true },
  updatedBy:         { name: 'updated_by'                          },
} satisfies ColumnMapping<ResultField>;
