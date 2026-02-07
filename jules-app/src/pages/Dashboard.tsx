import { useState, useEffect } from "react";
import { getJulesClient } from "../lib/jules-client";
import { SessionResource } from "@google/jules-sdk";
import { Link } from "react-router-dom";
import { Play, Eye, X, Check, Filter, Search, Github } from "lucide-react";

interface Session {
  id: string;
  status: string;
  createdAt: string;
  repo: string;
  branch: string;
  prompt: string;
}

export function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const client = getJulesClient();

        // Sync local cache with API
        try {
          await client.sync({ limit: 50, depth: 'metadata' });
        } catch (syncErr) {
          console.warn("Sync failed, falling back to direct API list", syncErr);
        }

        // Use SDK select() for rich querying as recommended in README
        const queryResult = await client.select({
          from: 'sessions',
          limit: 50,
          order: 'desc'
        });

        // Extract session data from query results
        // select() returns QueryResult[] which are the session resources themselves
        const sessionsList = queryResult as unknown as SessionResource[];

        const mappedSessions: Session[] = sessionsList.map(s => {
          let status = "pending";
          const state = (s.state || '').toLowerCase();

          if (["inprogress", "planning", "awaitingplanapproval", "awaitinguserfeedback"].includes(state)) {
            status = "running";
          } else if (state === "completed") {
            status = "completed";
          } else if (state === "failed") {
            status = "failed";
          }

          let repo = "Repoless";
          if (s.source?.type === "githubRepo") {
            repo = `${s.source.githubRepo.owner}/${s.source.githubRepo.repo}`;
          } else if (s.sourceContext?.source) {
            repo = s.sourceContext.source.replace(/^sources\/github\//, "");
          }

          return {
            id: s.id,
            status,
            createdAt: s.createTime || s.updateTime || new Date().toISOString(),
            repo,
            branch: s.sourceContext?.githubRepoContext?.startingBranch || "main",
            prompt: s.prompt || s.title || "Untitled Session"
          };
        });

        setSessions(mappedSessions);
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(s => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search && !s.prompt.toLowerCase().includes(search.toLowerCase()) && !s.id.includes(search)) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "failed": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-sm md:text-base text-muted-foreground">Manage and monitor your AI coding sessions.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Link to="/create" className="w-full md:w-auto bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition shadow-sm flex items-center justify-center gap-2">
            <Play size={16} /> New Session
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl border border-border flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search sessions..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <Filter size={16} className="text-muted-foreground shrink-0" />
          {["all", "running", "completed", "failed", "pending"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Session List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border border-dashed">
            No sessions found matching your criteria.
          </div>
        ) : (
          filteredSessions.map(session => (
            <div key={session.id} className="bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium border ${getStatusColor(session.status)} uppercase tracking-wide`}>
                      {session.status}
                    </span>
                    <span className="text-[10px] md:text-xs text-muted-foreground font-mono">{session.id}</span>
                    <span className="text-[10px] md:text-xs text-muted-foreground">• {new Date(session.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors">
                    {session.prompt}
                  </h3>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      <Github size={14} className="shrink-0" />
                      <span className="font-mono truncate">{session.repo}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded text-[10px] md:text-xs font-mono w-fit">
                      Branch: {session.branch}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto justify-end">
                   <Link
                    to={`/stream/${session.id}`}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="View Stream"
                  >
                    <Eye size={20} />
                  </Link>
                   {session.status === "running" && (
                     <>
                      <button className="p-2 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors" title="Approve">
                        <Check size={20} />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Cancel">
                        <X size={20} />
                      </button>
                     </>
                   )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
