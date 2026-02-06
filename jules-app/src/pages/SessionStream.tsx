
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getJulesClient } from "../lib/jules-client";
import { Send, Terminal, FileCode, MessageSquare, Activity } from "lucide-react";
import Editor from "@monaco-editor/react";

interface ActivityItem {
  type: string;
  data: any;
  timestamp: number;
}

interface Message {
  role: "user" | "agent";
  content: string;
}

export function SessionStream() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [status, setStatus] = useState<string>("initializing");
  const [plan, setPlan] = useState<any>(null);
  const [diffs, setDiffs] = useState<any[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Helper to handle events
  const handleEvent = (event: any) => {
    setActivities(prev => [...prev, { type: event.type, data: event, timestamp: Date.now() }]);

    switch (event.type) {
      case "planGenerated":
        setPlan(event.plan);
        break;
      case "progressUpdated":
        if (event.output) {
             setTerminalOutput(prev => prev + event.output + "\n");
        }
        if (event.diff) {
            setDiffs(prev => [...prev, event.diff]);
        }
        break;
      case "agentMessaged":
        setMessages(prev => [...prev, { role: "agent", content: event.message }]);
        break;
      case "sessionCompleted":
        setStatus("completed");
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
           for await (const event of stream) {
             if (!isActive) break;
             handleEvent(event);
           }
        } catch (e) {
           console.warn("Streaming not available or failed", e);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      {/* Left Panel: Activity & Plan */}
      <div className="lg:col-span-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-foreground">
                <Activity size={18} /> Activity & Plan
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${status === "connected" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                {status}
            </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {plan ? (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-2 text-primary">Current Plan</h4>
                    <ol className="list-decimal pl-4 text-sm space-y-1 text-muted-foreground">
                        {plan.steps?.map((step: any, i: number) => (
                            <li key={i}>{step.title || step}</li>
                        ))}
                    </ol>
                     <div className="mt-4 flex gap-2">
                        <button onClick={handleApprove} className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition shadow-sm font-medium">Approve Plan</button>
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

      {/* Middle Panel: Code/Diff Viewer */}
      <div className="lg:col-span-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden shadow-sm">
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
                    value={diffs[diffs.length - 1]?.content || "// No content"}
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
                 />
             ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                     <FileCode size={48} className="mb-4 opacity-20" />
                     <p className="text-sm">No file changes available</p>
                 </div>
             )}
        </div>
      </div>

      {/* Right Panel: Terminal & Chat */}
      <div className="lg:col-span-1 flex flex-col gap-6 h-full">
         {/* Terminal */}
        <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden min-h-[200px] shadow-sm">
             <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-bold flex items-center gap-2 text-foreground">
                    <Terminal size={18} /> Terminal Output
                </h3>
            </div>
            <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-xs text-green-400">
                <pre className="whitespace-pre-wrap break-words">{terminalOutput || "$ Waiting for output..."}</pre>
            </div>
        </div>

        {/* Chat */}
        <div className="flex-1 bg-card rounded-xl border border-border flex flex-col overflow-hidden min-h-[300px] shadow-sm">
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
                        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
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
                        className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-input focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-muted-foreground/50"
                        placeholder="Message Jules..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}
