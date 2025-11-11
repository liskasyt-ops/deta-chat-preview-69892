import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { conversationStorage } from "@/lib/conversationStorage";

interface ConversationHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export const ConversationHistory = ({
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
}: ConversationHistoryProps) => {
  const conversations = conversationStorage.getAll();

  return (
    <ScrollArea className="flex-1 px-2">
      <div className="space-y-2 py-2">
        {conversations.map((conv, index) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative group"
          >
            <Button
              variant={currentConversationId === conv.id ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 pr-10 text-sm"
              onClick={() => onSelectConversation(conv.id)}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-left flex-1">{conv.title}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv.id);
              }}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </motion.div>
        ))}
        {conversations.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No conversations yet
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
