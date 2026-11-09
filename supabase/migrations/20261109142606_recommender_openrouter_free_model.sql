ALTER TABLE ai_settings DROP CONSTRAINT IF EXISTS ai_settings_model_allowed;

UPDATE ai_settings SET model = 'openrouter/free' WHERE id = 1;

ALTER TABLE ai_settings ADD CONSTRAINT ai_settings_model_allowed
  CHECK (model IN ('openrouter/free'));

ALTER TABLE ai_settings ALTER COLUMN model SET DEFAULT 'openrouter/free';
