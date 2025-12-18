CREATE TABLE IF NOT EXISTS analysis_jobs (
  token UUID PRIMARY KEY,
  api_key_id INT NOT NULL,
  user_id INT,
  agent TEXT,
  ip_address TEXT,
  api_version TEXT,
  endpoint TEXT,
  openforis_whisp_version TEXT,
  earthengine_api_version TEXT,
  status TEXT NOT NULL,
  feature_count INT,
  analysis_options JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_api_key_id ON analysis_jobs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);

