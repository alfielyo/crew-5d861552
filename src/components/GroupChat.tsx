import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  full_name: string | null;
};

interface GroupChatProps {
  groupId: string;
  currentUserId: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GroupChat({ groupId, currentUserId }: GroupChatProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["group-messages", groupId],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from("group_messages")
        .select(`
          id,
          user_id,
          content,
          created_at,
          profiles:user_id ( full_name )
        `)
        .eq("run_group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        content: m.content,
        created_at: m.created_at,
        full_name: m.profiles?.full_name ?? null,
      }));
    },
  });

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `run_group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase.from("group_messages").insert({
      run_group_id: groupId,
      user_id: currentUserId,
      content,
    });
    setSending(false);
    if (error) setText(content); // restore on failure
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isOwn = msg.user_id === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                {!isOwn && (
                  <span className="text-xs text-muted-foreground mb-0.5">
                    {msg.full_name ?? "Runner"}
                  </span>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {formatTime(msg.created_at)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message your crew…"
          className="border-border bg-secondary flex-1"
          maxLength={1000}
          disabled={sending}
        />
        <Button size="icon" onClick={handleSend} disabled={!text.trim() || sending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
