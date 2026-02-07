import { jules, MissingApiKeyError } from '@google/jules-sdk';

export const JULES_API_KEY_STORAGE_KEY = 'jules_api_key';

export const getApiKey = () => {
  return sessionStorage.getItem(JULES_API_KEY_STORAGE_KEY);
};

export const setApiKey = (key: string) => {
  sessionStorage.setItem(JULES_API_KEY_STORAGE_KEY, key);
};

export const clearApiKey = () => {
  sessionStorage.removeItem(JULES_API_KEY_STORAGE_KEY);
};

export const getJulesClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  return jules.with({ apiKey });
};
