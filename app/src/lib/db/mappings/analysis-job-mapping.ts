import type { AnalysisJob } from '@/types/models/analysis-job';
import type { ColumnMapping } from './column-mapping';

// apiKey, resultsAvailable → not stored in DB
export const analysisJobMapping = {
  id:                    { name: 'id'                          },
  createdAt:             { name: 'created_at',  readonly: true },
  apiKeyId:              { name: 'api_key_id', path: 'apiKey.keyId'  },
  userId:                { name: 'user_id',    path: 'apiKey.userId' },
  status:                { name: 'status'                      },
  featureCount:          { name: 'feature_count'               },
  analysisOptions:       { name: 'analysis_options', jsonb: true },
  timeoutSeconds:        { name: 'timeout_seconds'             },
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
