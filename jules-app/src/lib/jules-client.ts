import { jules } from '@google/jules-sdk';

export const JULES_API_KEY_STORAGE_KEY = 'jules_api_key';

export const getApiKey = () => {
  return localStorage.getItem(JULES_API_KEY_STORAGE_KEY);
};

export const setApiKey = (key: string) => {
  localStorage.setItem(JULES_API_KEY_STORAGE_KEY, key);
};

export const clearApiKey = () => {
  localStorage.removeItem(JULES_API_KEY_STORAGE_KEY);
};

export const getJulesClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API Key not found');
  }
  return jules.with({ apiKey });
};
