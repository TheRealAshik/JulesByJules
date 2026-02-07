import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getJulesClient } from "../lib/jules-client";
import { Activity, BashArtifact, ChangeSetArtifact, ActivityPlanGenerated, ActivityAgentMessaged, Plan } from "@google/jules-sdk";
import { Send, Terminal, FileCode, MessageSquare, Activity as ActivityIcon } from "lucide-react";
import Editor from "@monaco-editor/react";

interface ActivityItem {
  type: string;
  data: unknown;
  timestamp: number;
}

interface Message {
  role: "user" | "agent";
  content: string;
}

type Tab = "activity" | "code" | "terminal" | "chat";

export function SessionStream() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [status, setStatus] = useState<string>("initializing");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [diffs, setDiffs] = useState<Record<string, unknown>[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("activity");

  const bottomRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Helper to handle events
  const handleEvent = (event: Activity) => {
    setActivities(prev => [...prev, { type: String(event.type), data: event, timestamp: Date.now() }]);

    // Handle artifacts if present
    if (event.artifacts && Array.isArray(event.artifacts)) {
      event.artifacts.forEach((artifact) => {
        if (artifact.type === 'bashOutput') {
          const bash = artifact as unknown as BashArtifact;
          setTerminalOutput(prev => prev + bash.toString() + "\n");
        } else if (artifact.type === 'changeSet') {
          const cs = artifact as unknown as ChangeSetArtifact;
          const content = cs.gitPatch?.unidiffPatch || cs.source || "";
          setDiffs(prev => [...prev, { content }]);
        }
      });
    }

    switch (event.type) {
      case "planGenerated":
        setPlan((event as ActivityPlanGenerated).plan);
        break;
      case "agentMessaged":
        setMessages(prev => [...prev, { role: "agent", content: (event as ActivityAgentMessaged).message }]);
        break;
      case "sessionCompleted":
        setStatus("completed");
        break;
      case "sessionFailed":
        setStatus("failed");
        break;
    }
  };

  useEffect(() => {
    if (!sessionId) return;

    let isActive = true;

    const connectStream = async () => {
      try {
        const client = getJulesClient();
        const session = client.session(sessionId);

        setStatus("connected");

        // Start streaming
        try {
           const stream = await session.stream();
           for await (const event of (stream as AsyncIterable<Activity>)) {
             if (!isActive) break;
             handleEvent(event);
           }
        } catch (e) {
           console.warn("Streaming not available or failed", e);
           setStatus("error");
        }
      } catch (err) {
        console.error("Stream error:", err);
        setStatus("error");
      }
    };

    connectStream();

    return () => {
      isActive = false;
    };
  }, [sessionId]);

  // Auto-scroll for activities
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activities]);

  // Auto-scroll for terminal
  useEffect(() => {
      if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
  }, [terminalOutput]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: chatInput }]);
    const input = chatInput;
    setChatInput("");

    try {
       const client = getJulesClient();
       const session = client.session(sessionId!);
       await session.ask(input);
    } catch (err) {
        console.error("Failed to send message:", err);
    }
  };

  const handleApprove = async () => {
      try {
        const client = getJulesClient();
        const session = client.session(sessionId!);
        await session.approve();
      } catch (err) {
          console.error("Failed to approve:", err);
      }
  };

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "activity", icon: <ActivityIcon size={18} />, label: "Plan" },
    { id: "code", icon: <FileCode size={18} />, label: "Code" },
    { id: "terminal", icon: <Terminal size={18} />, label: "Terminal" },
    { id: "chat", icon: <MessageSquare size={18} />, label: "Chat" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-100px)]">
      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex border-b border-border bg-card mb-4 rounded-xl overflow-hidden shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${
              activeTab === tab.id
                ? "bg-primary/10 text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.icon}
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Activity & Plan */}
        <div className={`lg:col-span-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden shadow-sm ${activeTab === "activity" ? "flex" : "hidden lg:flex"}`}>
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-foreground">
                  <ActivityIcon size={18} /> Activity & Plan
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${status === "connected" ? "bg-green-500/10 text-green-500" : status === "error" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                  {status}
              </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {plan ? (
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <h4 className="font-semibold mb-2 text-primary">Current Plan</h4>
                      <ol className="list-decimal pl-4 text-sm space-y-1 text-muted-foreground">
                          {plan.steps?.map((step, i: number) => (
                              <li key={i}>{String(step.title || step)}</li>
                          ))}
                      </ol>
                       <div className="mt-4 flex gap-2">
                          <button onClick={handleApprove} className="w-full md:w-auto px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition shadow-sm font-medium">Approve Plan</button>
                      </div>
                  </div>
              ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                      Waiting for plan generation...
                  </div>
              )}

              <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Activity Log</h4>
                  {activities.length === 0 && <p className="text-xs text-muted-foreground/50 italic">No activity yet</p>}
                  {activities.map((act, i) => (
                      <div key={i} className="text-xs text-muted-foreground border-l-2 border-muted pl-2 py-1 transition-all hover:bg-muted/10 rounded-r">
                          <span className="font-mono opacity-50 mr-2">[{new Date(act.timestamp).toLocaleTimeString()}]</span>
                          <span className="font-medium text-foreground">{act.type}</span>
                      </div>
                  ))}
                  <div ref={bottomRef} />
              </div>
          </div>
        </div>

        {/* Code/Diff Viewer */}
        <div className={`lg:col-span-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden shadow-sm ${activeTab === "code" ? "flex" : "hidden lg:flex"}`}>
          <div className="p-4 border-b border-border bg-muted/30">
               <h3 className="font-bold flex items-center gap-2 text-foreground">
                  <FileCode size={18} /> Code Changes
              </h3>
          </div>
          <div className="flex-1 bg-[#1e1e1e] relative">
               {diffs.length > 0 ? (
                   <Editor
                      height="100%"
                      defaultLanguage="typescript"
                      theme="vs-dark"
                      value={String(diffs[diffs.length - 1]?.content || "// No content")}
                      options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
                   />
               ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 p-6 text-center">
                       <FileCode size={48} className="mb-4 opacity-20" />
                       <p className="text-sm">No file changes available</p>
                   </div>
               )}
          </div>
        </div>

        {/* Terminal & Chat */}
        <div className={`lg:col-span-1 flex flex-col gap-6 h-full ${activeTab === "terminal" || activeTab === "chat" ? "flex" : "hidden lg:flex"}`}>
           {/* Terminal */}
          <div className={`flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden min-h-[200px] shadow-sm ${activeTab === "terminal" ? "flex" : "hidden lg:flex"}`}>
               <div className="p-4 border-b border-border bg-muted/30">
                  <h3 className="font-bold flex items-center gap-2 text-foreground">
                      <Terminal size={18} /> Terminal Output
                  </h3>
              </div>
              <div ref={terminalRef} className="flex-1 bg-black p-4 overflow-y-auto font-mono text-[10px] md:text-xs text-green-400">
                  <pre className="whitespace-pre-wrap break-words">{terminalOutput || "$ Waiting for output..."}</pre>
              </div>
          </div>

          {/* Chat */}
          <div className={`flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden min-h-[300px] shadow-sm ${activeTab === "chat" ? "flex" : "hidden lg:flex"}`}>
               <div className="p-4 border-b border-border bg-muted/30">
                  <h3 className="font-bold flex items-center gap-2 text-foreground">
                      <MessageSquare size={18} /> Agent Chat
                  </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
                  {messages.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-8">
                          Start a conversation with the agent...
                      </div>
                  )}
                  {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[90%] md:max-w-[85%] px-3 md:px-4 py-2 md:py-2.5 rounded-2xl text-sm shadow-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                              {msg.content}
                          </div>
                      </div>
                  ))}
              </div>
              <div className="p-4 border-t border-border bg-card">
                  <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                      }}
                  >
                      <input
                          className="flex-1 px-4 py-2 md:py-2.5 rounded-lg bg-background border border-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/50 text-sm"
                          placeholder="Message Jules..."
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                      />
                      <button
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="p-2 md:p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
                      >
                          <Send size={18} />
                      </button>
                  </form>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
