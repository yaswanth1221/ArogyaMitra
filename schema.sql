CREATE TABLE IF NOT EXISTS sync_records (
  owner_id TEXT NOT NULL,
  entity TEXT NOT NULL CHECK (entity IN ('household', 'note', 'chat', 'setting')),
  record_id TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (owner_id, entity, record_id)
);

CREATE INDEX IF NOT EXISTS sync_records_owner_updated
  ON sync_records (owner_id, updated_at);
