import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, Plus, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MessageBubble from "@/components/mentor/MessageBubble";

const AGENT_NAME = "ai_mentor";

const STARTERS = [
  "I want to build a chatbot — where do I start?",
  "Which AI tools are best for making a presentation?",
  "Suggest a hackathon project for a beginner team",
];

export default function Mentor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const conversationRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const endRef = useRef(null);

  const attach = (conversation) => {
    conversationRef.current = conversation;
    if (!conversation?.id) return;
    unsubscribeRef.current?.();
    unsubscribeRef.current = base44.agents.subscribeToConversation(conversation.id, (data) => {
      const incoming = data?.messages || [];
      if (!incoming.length) return;
      setMessages(incoming);
      const last = incoming[incoming.length - 1];
      if (last?.role === "assistant") setSending(false);
    });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      const conversations = Array.isArray(result) ? result : result?.items || [];
      const latest = conversations[0];
      if (!active) return;
      if (latest?.id) {
        const conversation = await base44.agents.getConversation(latest.id);
        if (!active) return;
        attach(conversation);
        setMessages(conversation?.messages || []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
      unsubscribeRef.current?.();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const startNewChat = () => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    conversationRef.current = null;
    setMessages([]);
    setSending(false);
    setInput("");
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content }]);
    try {
      let conversation = conversationRef.current;
      if (!conversation) {
        conversation = await base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: { name: content.slice(0, 60), description: "AI mentor conversation" },
        });
        attach(conversation);
      }
      await base44.agents.addMessage(conversation, { role: "user", content });
    } catch {
      setSending(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong reaching your mentor. Please try again." },
      ]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-heading font-extrabold text-2xl flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" /> Ask Your Engineering Mentor
        </h1>
        <button
          type="button"
          onClick={startNewChat}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mt-4 space-y-4 pb-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your conversation...
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-3.5 text-sm bg-card border border-border">
                  <p>
                    Hi! I'm your AI Engineering Mentor. Tell me what you want to build or learn, and I'll point you to
                    the right tools, learning paths, coding problems, prompts and hackathon problem statements in this
                    app.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STARTERS.map((starter) => (
                      <button
                        key={starter}
                        type="button"
                        onClick={() => send(starter)}
                        className="text-xs font-medium px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors text-left"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <MessageBubble key={message.id || index} message={message} />
            ))}

            {sending && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-lg p-3.5 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Looking through the directory...
                </div>
              </div>
            )}
          </>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 border border-border rounded-lg p-2 bg-card">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask your mentor anything..."
          className="flex-1 outline-none text-sm px-2 py-2 bg-transparent"
        />
        <button
          type="button"
          onClick={() => send()}
          disabled={sending || !input.trim()}
          aria-label="Send message"
          className="p-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}