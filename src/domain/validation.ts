import { z } from 'zod';
import { CastSchema, CastEnvelopeSchema, ContentPackSchema, GameSettingsSchema, RunRecordSchema, RunEnvelopeSchema, HistoryEnvelopeSchema, type CastDefinition, type ContentPack, type GameSettings, type RunRecord, type RunEnvelope, type HistoryEnvelope } from './schemas';

export interface ValidationError { code: string; path: string; message: string }
export type ValidationResult<T> = { success: true; data: T } | { success: false; errors: ValidationError[] };
export function validateWith<T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);
  return result.success ? { success: true, data: result.data } : { success: false, errors: result.error.issues.map(i => ({ code: i.code, path: i.path.join('.') || '$', message: i.message })) };
}
export function validateCast(input: unknown): ValidationResult<CastDefinition> {
  if (typeof input === 'object' && input !== null && 'kind' in input) {
    const result = validateWith(CastEnvelopeSchema, input);
    return result.success ? { success: true, data: result.data.cast } : result;
  }
  return validateWith(CastSchema, input);
}
export const validateContentPack = (input: unknown): ValidationResult<ContentPack> => validateWith(ContentPackSchema, input);
export const validateSettings = (input: unknown): ValidationResult<GameSettings> => validateWith(GameSettingsSchema, input);
export const validateRun = (input: unknown): ValidationResult<RunRecord> => validateWith(RunRecordSchema, input);
export const validateRunEnvelope = (input: unknown): ValidationResult<RunEnvelope> => validateWith(RunEnvelopeSchema, input);
export const validateHistoryEnvelope = (input: unknown): ValidationResult<HistoryEnvelope> => validateWith(HistoryEnvelopeSchema, input);
export function parseJson(text: string): ValidationResult<unknown> {
  if (text.length > 30_000_000) return { success: false, errors: [{ code: 'too_large', path: '$', message: 'This JSON file exceeds the 30 MB import limit.' }] };
  try { return { success: true, data: JSON.parse(text) as unknown }; }
  catch { return { success: false, errors: [{ code: 'invalid_json', path: '$', message: 'This file is not valid JSON. Check commas and quotation marks.' }] }; }
}

