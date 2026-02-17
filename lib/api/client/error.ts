import axios from 'axios';

const codeMessageMap: Record<string, string> = {
  VALIDATION_ERROR: 'Dados inválidos. Revise os campos e tente novamente.',
  TASK_NOT_FOUND: 'Tarefa não encontrada.',
  RULE_ID_CONFLICT: 'Já existe uma regra com esse identificador.',
  CUSTOM_RULE_NOT_FOUND: 'Regra personalizada não encontrada.',
  INVALID_PARAMETERS: 'Parâmetros inválidos para esta regra.',
  INVALID_PARAMETERS_SCHEMA: 'Schema de parâmetros inválido.',
  INVALID_PARAMETERS_TEMPLATE: 'Template de parâmetros inválido.',
  CLIENT_ID_REQUIRED: 'Selecione um cliente antes de continuar.',
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const payload = error.response?.data as
    | { message?: string; error?: string; code?: string }
    | undefined;

  if (payload?.code && codeMessageMap[payload.code]) return codeMessageMap[payload.code];
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  if (payload?.code) return payload.code;
  if (error.message) return error.message;

  return fallback;
};
