import { useMemo, useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { apiFetch } from "../api";
import "./AiChat.css";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m your FinTrack assistant. Ask me questions about the app. (Actions like “add an expense” will come next.)",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !sending,
    [input, sending],
  );

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendPrompt = async (text: string, currentMessages: ChatMessage[], displayText?: string) => {
    if (sending) return;

    const userMessage: ChatMessage = { role: "user", content: displayText ?? text };

    setSending(true);
    setMessages((prev) => [...prev, userMessage]);

    try {
      // The current messages state plus the new user message
      // We pass the messages currently in the list as history
      const res = await apiFetch("/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: currentMessages,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI request failed (${res.status})`);
      }

      const data = (await res.json()) as { reply?: string };
      const reply = data.reply ?? "Sorry — I did not understand that.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not reach the AI service. Please check if the server is running.",
        },
      ]);
    } finally {
      setSending(false);
      queueMicrotask(() => inputRef.current?.focus());
    }
  };

  // Normal conversational message
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    await sendPrompt(text, messages);
  };

  const runAnalysis = async () => {
    if (sending) return;
    const res = await apiFetch("/ai/prompts/analysis");
    const data = (await res.json()) as { prompt?: string };
    const prompt =
      data.prompt ??
      "Give me a full financial analysis of my current situation.";
    void sendPrompt(prompt, messages, "Analyze My Finances");
  };

  return (
    <div className="ai-chat">
      <div className="ai-chat-thread" ref={threadRef}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`ai-chat-bubble ${m.role === "user" ? "ai-chat-bubble-user" : "ai-chat-bubble-assistant"}`}
          >
            {m.role === "assistant" ? (
              <ReactMarkdown>{m.content}</ReactMarkdown>
            ) : (
              m.content
            )}
          </div>
        ))}
        {sending && <div className="ai-chat-typing">Thinking…</div>}
      </div>

      <div className="ai-chat-quick-actions">
        <button
          className="ai-chat-quick-btn"
          onClick={() => {
            void runAnalysis();
          }}
          disabled={sending}
          type="button"
        >
          Analyze My Finances
        </button>
      </div>

      <form
        className="ai-chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) {
                void sendMessage();
              }
            }
          }}
          placeholder="Ask FinTrack…"
          aria-label="Chat message"
          disabled={sending}
        />
      </form>
    </div>
  );
}
