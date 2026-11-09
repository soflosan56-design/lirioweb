ALTER TABLE ai_settings DROP CONSTRAINT IF EXISTS ai_settings_model_allowed;

UPDATE ai_settings SET model = 'gemini-2.5-flash' WHERE id = 1;

ALTER TABLE ai_settings ADD CONSTRAINT ai_settings_model_allowed
  CHECK (model IN ('gemini-2.5-flash'));

ALTER TABLE ai_settings ALTER COLUMN model SET DEFAULT 'gemini-2.5-flash';
