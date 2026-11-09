import { FunctionsHttpError } from '@supabase/supabase-js';

export async function readFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const body = (await error.context.json().catch(() => null)) as { error?: string } | null;
    if (body?.error) return body.error;
  }
  return fallback;
}
