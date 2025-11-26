CREATE TABLE IF NOT EXISTS notification_subscriptions (
  email TEXT PRIMARY KEY,
  subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_subscribed ON notification_subscriptions(subscribed);

