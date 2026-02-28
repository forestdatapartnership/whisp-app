import type { AnalysisJob } from '@/types/models/analysisJob';
import type { ColumnMapping } from './columnMapping';

// apiKey, resultsAvailable, timeoutMs → not stored in DB
export const analysisJobMapping = {
  id:                    { name: 'id'                          },
  createdAt:             { name: 'created_at',  readonly: true },
  apiKeyId:              { name: 'api_key_id', path: 'apiKey.keyId'  },
  userId:                { name: 'user_id',    path: 'apiKey.userId' },
  status:                { name: 'status'                      },
  featureCount:          { name: 'feature_count'               },
  analysisOptions:       { name: 'analysis_options'            },
  startedAt:             { name: 'started_at'                  },
  completedAt:           { name: 'completed_at'                },
  errorMessage:          { name: 'error_message'               },
  ipAddress:             { name: 'ip_address'                  },
  agent:                 { name: 'agent'                       },
  apiVersion:            { name: 'api_version'                 },
  endpoint:              { name: 'endpoint'                    },
  openforisWhispVersion: { name: 'openforis_whisp_version'    },
  earthengineApiVersion: { name: 'earthengine_api_version'    },
} satisfies Partial<ColumnMapping<AnalysisJob>>;
