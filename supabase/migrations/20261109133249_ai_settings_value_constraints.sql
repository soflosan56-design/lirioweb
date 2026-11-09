/*
# Límites de valores para los ajustes del recomendador

## 1. Cambios
- `ai_settings.model`: solo puede ser uno de los modelos permitidos para el recomendador.
- `ai_settings.instructions`: máximo 2000 caracteres y no puede quedar vacío.

## 2. Seguridad
- Sin cambios en permisos ni políticas: solo los administradores siguen pudiendo modificar la fila.

## 3. Notas importantes
- La migración es repetible: comprueba si la restricción ya existe antes de crearla.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_settings_model_allowed') THEN
    ALTER TABLE ai_settings ADD CONSTRAINT ai_settings_model_allowed
      CHECK (model IN ('gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_settings_instructions_length') THEN
    ALTER TABLE ai_settings ADD CONSTRAINT ai_settings_instructions_length
      CHECK (char_length(trim(instructions)) BETWEEN 1 AND 2000);
  END IF;
END $$;
