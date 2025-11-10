import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Array<{ role: string; content: string }>;
}

interface ConversationHistoryProps {
  onSelectConversation: (conversation: Conversation) => void;
  currentConversationId?: string;
  onDeleteConversation?: (id: string) => void;
}

export const ConversationHistory = ({
  onSelectConversation,
  currentConversationId,
  onDeleteConversation,
}: ConversationHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    try {
      const stored = localStorage.getItem("deta_conversations");
      if (stored) {
        const parsed = JSON.parse(stored);
        setConversations(parsed.sort((a: Conversation, b: Conversation) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ));
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem("deta_conversations");
      if (stored) {
        const parsed = JSON.parse(stored);
        const filtered = parsed.filter((c: Conversation) => c.id !== id);
        localStorage.setItem("deta_conversations", JSON.stringify(filtered));
        setConversations(filtered);
        toast.success("Conversation deleted");
        onDeleteConversation?.(id);
      }
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
  };

  const startEditing = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditingTitle(conversation.title || "");
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingTitle("");
  };

  const saveTitle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    try {
      const stored = localStorage.getItem("deta_conversations");
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((c: Conversation) => 
          c.id === id ? { ...c, title: editingTitle.trim(), updated_at: new Date().toISOString() } : c
        );
        localStorage.setItem("deta_conversations", JSON.stringify(updated));
        setConversations(updated);
        setEditingId(null);
        setEditingTitle("");
        toast.success("Title updated");
      }
    } catch (error) {
      toast.error("Failed to update title");
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4 text-xs px-3">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="space-y-1 px-2">
      {conversations.map((conversation) => (
        <motion.div
          key={conversation.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`group rounded-lg p-2 cursor-pointer hover:bg-sidebar-accent transition-smooth ${
            currentConversationId === conversation.id
              ? "bg-sidebar-accent"
              : ""
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {editingId === conversation.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="h-6 text-xs px-1"
                      autoFocus
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') saveTitle(conversation.id, e as any);
                        if (e.key === 'Escape') cancelEditing(e as any);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => saveTitle(conversation.id, e)}
                      className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={cancelEditing}
                      className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-medium text-foreground truncate">
                      {conversation.title || "New Conversation"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(conversation.updated_at), "MMM d")}
                    </p>
                  </>
                )}
              </div>
            </div>
            {editingId !== conversation.id && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => startEditing(conversation, e)}
                  className="h-6 w-6 hover:bg-primary/10 hover:text-primary shrink-0"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => deleteConversation(conversation.id, e)}
                  className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
