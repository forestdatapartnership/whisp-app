CREATE TABLE IF NOT EXISTS feedback (
  response_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (response_id, question)
);
