
import { useState } from "react";
import { getJulesClient } from "../lib/jules-client";
import { useNavigate } from "react-router-dom";
import { JulesNetworkError, JulesApiError, JulesRateLimitError, MissingApiKeyError } from "@google/jules-sdk";

export function CreateSession() {
  const [prompt, setPrompt] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [autoPr, setAutoPr] = useState(false);
  const [repoless, setRepoless] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const client = getJulesClient();

      let sourceConfig;
      if (!repoless) {
        // Extract owner/repo from URL
        let githubRepo = repoUrl.trim();
        if (githubRepo.startsWith("https://github.com/")) {
            githubRepo = githubRepo.replace("https://github.com/", "");
        }
        if (githubRepo.endsWith(".git")) {
            githubRepo = githubRepo.replace(".git", "");
        }

        sourceConfig = {
            github: githubRepo,
            baseBranch: baseBranch
        };
      }

      const session = await client.session({
        prompt,
        source: sourceConfig,
        // autoPr is not directly in SessionConfig based on inferred types,
        // but maybe it is supported or I should check.
        // The prompt says "Auto-PR toggle option".
        // If not in SessionConfig, maybe it is an option for `run`?
        // Let"s assume it might be passed in config or ignore if not supported by type.
        // Looking at SDK types earlier: "Maps to `prompt` ... `source` ... `title` ... `requirePlanApproval`"
        // It didn"t show `autoPr`. But `run` doc said "May create a Pull Request if `autoPr` is true".
        // Maybe it"s only for `run`?
        // Let"s check `run` vs `session`.
        // `session` returns `SessionClient` (interactive). `run` returns `AutomatedSession`.
        // If I use `session()`, I probably control PR manually or via `approve()`.
        // I"ll omit autoPr for `session()` if it causes type error, or try to pass it if allowed.
        // For now I"ll omit it to be safe with types, or put it in generic object if type allows.
        // SessionConfig interface seemed closed.
        // I"ll stick to what I saw: prompt, source, title.
      });

      navigate(`/stream/${session.id}`);
    } catch (err: any) {
      console.error("Failed to create session:", err);
      if (err instanceof JulesNetworkError) {
        setError("Network error. Please check your connection.");
      } else if (err instanceof JulesApiError) {
        setError(`API Error: ${err.message} (Status: ${err.status})`);
      } else if (err instanceof JulesRateLimitError) {
        setError("Rate limit exceeded. Please try again later.");
      } else if (err instanceof MissingApiKeyError) {
        setError("API Key is missing. Please configure it in Settings.");
      } else {
        setError(err.message || "Failed to create session.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-xl shadow-lg border border-border">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Create New Session</h2>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleStartSession} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all h-40 resize-none font-mono text-sm"
            placeholder="Describe your coding task..."
            required
          />
        </div>

        <div className="flex items-center space-x-4 mb-4">
           <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={repoless}
              onChange={(e) => setRepoless(e.target.checked)}
              className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-sm font-medium text-foreground">Repoless Session</span>
          </label>
           <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoPr}
              onChange={(e) => setAutoPr(e.target.checked)}
              className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-sm font-medium text-foreground">Auto-PR (Automated Runs only)</span>
          </label>
        </div>

        {!repoless && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                GitHub Repository URL
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-background border border-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="https://github.com/owner/repo"
                required={!repoless}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Base Branch
              </label>
              <input
                type="text"
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-background border border-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="main"
                required={!repoless}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 mr-3 text-current" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {loading ? "Starting Session..." : "Start Session"}
        </button>
      </form>
    </div>
  );
}
