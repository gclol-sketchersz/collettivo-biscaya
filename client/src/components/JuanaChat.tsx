import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, X, Send, ThumbsUp, ThumbsDown, Star, Download, BarChart3 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// SVG Timone a 8 raggi
const HelmIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 200 200"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="12"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Cerchio esterno */}
    <circle cx="100" cy="100" r="85" />
    {/* 8 raggi */}
    <line x1="100" y1="15" x2="100" y2="50" />
    <line x1="100" y1="150" x2="100" y2="185" />
    <line x1="15" y1="100" x2="50" y2="100" />
    <line x1="150" y1="100" x2="185" y2="100" />
    <line x1="35" y1="35" x2="60" y2="60" />
    <line x1="140" y1="140" x2="165" y2="165" />
    <line x1="165" y1="35" x2="140" y2="60" />
    <line x1="60" y1="140" x2="35" y2="165" />
    {/* Cerchio centrale */}
    <circle cx="100" cy="100" r="20" />
  </svg>
);

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  feedback?: "like" | "dislike" | null;
  rating?: number | null;
  messageId?: number;
}

const QUICK_SUGGESTIONS = [
  "Mostrami bandi europei",
  "Consigli candidatura",
  "Bandi per mostre",
  "Residenze d'artista",
];

const BASQUE_PHRASES = [
  "Aúpa!",
  "Bixarren!",
  "Aurrera!",
  "Gora!",
  "Ondo!",
  "Txalo!",
];

export default function JuanaChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [tooltipIndex, setTooltipIndex] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user profile for personalization
  const { data: userProfile } = trpc.juana.getUserProfile.useQuery(undefined, {
    enabled: user?.id !== undefined,
  });

  // Fetch chat history on mount
  const { data: chatHistory } = trpc.juana.getHistory.useQuery(undefined, {
    enabled: user?.id !== undefined,
  });

  // Fetch chat statistics
  const { data: chatStats } = trpc.juana.getStatistics.useQuery(undefined, {
    enabled: user?.id !== undefined && showStats,
  });

  // Fetch history for export
  const { data: historyForExport } = trpc.juana.getHistoryForExport.useQuery(undefined, {
    enabled: user?.id !== undefined,
  });

  const ratingMutation = trpc.juana.saveRating.useMutation();

  useEffect(() => {
    setTooltipIndex(Math.floor(Math.random() * BASQUE_PHRASES.length));
  }, []);

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      const formattedMessages = chatHistory.map((msg) => ({
        id: `${msg.id}-${msg.role}`,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        feedback: null,
        rating: msg.rating || null,
        messageId: msg.id,
      }));
      setMessages(formattedMessages);
      setShowWelcome(false);
    }
  }, [chatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = trpc.juana.sendMessage.useMutation();

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: textToSend,
      timestamp: new Date(),
      feedback: null,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setShowWelcome(false);
    setIsLoading(true);

    try {
      const response = await sendMutation.mutateAsync({
        message: textToSend,
      });

      if (response.success) {
        const assistantMessage: Message = {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
          feedback: null,
          rating: null,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setHasNewMessage(true);
        setTimeout(() => setHasNewMessage(false), 3000);
      }
    } catch (error) {
      toast.error("Errore nell'invio del messaggio. Riprova.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const feedbackMutation = trpc.juana.saveFeedback.useMutation();

  const handleFeedback = (messageId: string, feedback: "like" | "dislike") => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );

    if (user?.id) {
      feedbackMutation.mutate({ messageId, feedback });
    }

    toast.success(feedback === "like" ? "Grazie per il feedback positivo!" : "Feedback registrato");
  };

  const handleRating = (messageId: string, rating: number) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message || !message.messageId) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, rating } : msg
      )
    );

    if (user?.id) {
      ratingMutation.mutate({
        messageId: message.messageId,
        rating,
      });
    }

    toast.success(`Valutazione: ${rating} stelle`);
  };

  const handleExportCSV = () => {
    if (!historyForExport || historyForExport.length === 0) {
      toast.error("Nessuna conversazione da esportare");
      return;
    }

    const csv = [
      ["Data", "Ruolo", "Messaggio", "Valutazione"].join(","),
      ...historyForExport.map((msg) =>
        [
          new Date(msg.createdAt).toLocaleString("it-IT"),
          msg.role,
          `"${msg.content.replace(/"/g, '""')}"`,
          msg.rating || "-",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `juana-chat-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Conversazione esportata in CSV");
  };

  const handleExportJSON = () => {
    if (!historyForExport || historyForExport.length === 0) {
      toast.error("Nessuna conversazione da esportare");
      return;
    }

    const json = JSON.stringify(historyForExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `juana-chat-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Conversazione esportata in JSON");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Bubble Button - Fixed bottom right with animations */}
      <div className="juana-tooltip fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110 ${
            isLoading ? "helm-pulse" : ""
          } ${hasNewMessage ? "helm-highlight" : ""}`}
          title="Apri Juana - Assistente IA"
        >
          <HelmIcon className={`w-6 h-6 ${isLoading ? "helm-spinning" : ""}`} />
        </button>
        <span className="tooltiptext">{BASQUE_PHRASES[tooltipIndex]}</span>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] flex flex-col shadow-2xl border border-blue-200 bg-background">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-2">
              <HelmIcon className="w-5 h-5" />
              <h3 className="font-semibold">Juana</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStats(!showStats)}
                className="text-white hover:bg-white/20"
                title="Statistiche chat"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Statistics Panel */}
          {showStats && chatStats && (
            <div className="border-b border-border p-3 bg-blue-50 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Messaggi totali:</span>
                <span className="font-semibold">{chatStats.totalMessages}</span>
              </div>
              <div className="flex justify-between">
                <span>Valutazioni medie:</span>
                <span className="font-semibold">{chatStats.averageRating}/5 ⭐</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportCSV}
                  className="flex-1 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportJSON}
                  className="flex-1 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  JSON
                </Button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {showWelcome && messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <div className="mb-4">
                  <HelmIcon className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                </div>
                <p className="font-medium mb-3">Aupa, capitano! Sono Juana</p>
                <p className="mb-4">la tua guida per i bandi culturali. Come posso aiutarti oggi?</p>
                {userProfile && (
                  <p className="text-xs text-blue-600 mt-3">
                    {userProfile.name ? `Benvenuto, ${userProfile.name}!` : ""}
                    {userProfile.subscriptionLevel && userProfile.subscriptionLevel !== "base" && (
                      <span> Piano: {userProfile.subscriptionLevel}</span>
                    )}
                  </p>
                )}

                {/* Quick Suggestions */}
                <div className="space-y-2 mt-4">
                  {QUICK_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSendMessage(suggestion)}
                      className="w-full px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-200 text-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {msg.timestamp.toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Rating and Feedback for Assistant Messages */}
                  {msg.role === "assistant" && (
                    <div className="flex gap-2 justify-start pl-2 flex-wrap">
                      {/* Star Rating */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRating(msg.id, star)}
                            className={`p-0.5 rounded transition-colors ${
                              msg.rating && msg.rating >= star
                                ? "text-yellow-400"
                                : "hover:text-yellow-300 text-gray-300"
                            }`}
                            title={`Valuta ${star} stelle`}
                          >
                            <Star className="w-3 h-3 fill-current" />
                          </button>
                        ))}
                      </div>

                      {/* Like/Dislike */}
                      <button
                        onClick={() => handleFeedback(msg.id, "like")}
                        className={`p-1 rounded transition-colors ${
                          msg.feedback === "like"
                            ? "bg-green-100 text-green-600"
                            : "hover:bg-gray-100 text-gray-500"
                        }`}
                        title="Risposta utile"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, "dislike")}
                        className={`p-1 rounded transition-colors ${
                          msg.feedback === "dislike"
                            ? "bg-red-100 text-red-600"
                            : "hover:bg-gray-100 text-gray-500"
                        }`}
                        title="Risposta non utile"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-foreground px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Juana sta scrivendo...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2 bg-background rounded-b-lg">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrivi un messaggio..."
              disabled={isLoading}
              className="text-sm"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
