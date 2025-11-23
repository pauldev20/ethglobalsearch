"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sendChatMessage } from "./actions";
import { Project } from "@/lib/api";
import { cn } from "@/lib/utils";
import { RenderedText } from "@/components/RenderedText";

type Message = {
  role: "user" | "assistant";
  content: string;
  projects: Project[];
};

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content:
      "Hello! I can help you find similar projects to the ones your thinking of!",
    projects: [],
  },
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (message: Message) =>
    setMessages((prev) => [...prev, message]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    addMessage({ role: "user", content: text, projects: [] });
    setInput("");
    setIsLoading(true);

    try {
      const res = await sendChatMessage(text);
      addMessage({
        role: "assistant",
        content: res.message ?? "No response.",
        projects: res.projects ?? [],
      });
    } catch {
      addMessage({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        projects: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <main className="relative flex-1 flex w-full flex-col items-center justify-center p-4 sm:p-8">
        <div className="relative z-10 w-full max-w-4xl h-[calc(100vh-12rem)]">
          <Card className="flex flex-col h-full py-0">
            {/* Header */}
            <div className="border-b px-6 py-4">
              <h1 className="text-2xl font-bold">Ask Talwar</h1>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {messages.map((message, idx) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={idx}
                    className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] px-4 py-2.5 text-sm shadow-sm",
                        isUser
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                          : "bg-muted rounded-2xl rounded-bl-md",
                      )}
                    >
					<RenderedText text={message.content} />
                      {!!message.projects.length && (
                        <div className="mt-3 -mx-4 -mb-2.5">
                          <div className="flex gap-3 overflow-x-auto pb-2.5 px-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                            {message.projects.map((project) => (
                              <Link
                                key={project.uuid}
                                href={`/search/${project.uuid}`}
                                className="shrink-0 w-64 group"
                              >
                                <div className="border rounded-lg overflow-hidden bg-background hover:shadow-lg transition-shadow h-full">
                                  {/* Project Image */}
                                  <div className="w-full h-36 bg-gray-100 relative overflow-hidden">
                                    {project.logo_url ? (
                                      <img
                                        src={project.logo_url}
                                        alt={project.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-4xl">
                                        {project.emoji || "🚀"}
                                      </div>
                                    )}
                                  </div>

                                  {/* Project Info */}
                                  <div className="p-3">
                                    <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                                      {project.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {project.tagline}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-muted text-sm shadow-sm">
                    Thinking…
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t px-6 py-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
				  name="message"
				  id="message"
                  value={input}
				  autoComplete="off"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
                  {isLoading ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
