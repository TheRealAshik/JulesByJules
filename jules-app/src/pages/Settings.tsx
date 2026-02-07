import { useState } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '../lib/jules-client';

export function Settings() {
  const [apiKey, setApiKeyState] = useState(() => getApiKey() || '');
  const [saved, setSaved] = useState(() => !!getApiKey());

  const handleSave = () => {
    if (apiKey.trim()) {
      setApiKey(apiKey.trim());
      setSaved(true);
    } else {
      clearApiKey();
      setSaved(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-xl shadow-lg border border-border">
      <h2 className="text-2xl font-bold mb-6 text-foreground">API Configuration</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Jules API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKeyState(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-background border border-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            placeholder="Enter your API key..."
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {saved ? 'Update API Key' : 'Save API Key'}
        </button>

        {saved && (
          <p className="text-sm text-green-500 text-center animate-pulse">
            API Key is configured (Session Storage).
          </p>
        )}
      </div>
    </div>
  );
}
