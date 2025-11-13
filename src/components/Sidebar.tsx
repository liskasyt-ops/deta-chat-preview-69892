import {
  MessageSquarePlus,
  Sparkles,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ConversationHistory } from "./ConversationHistory";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  onNewChat: () => void;
  onClearAllChats: () => void;
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export const Sidebar = ({ 
  onNewChat, 
  onClearAllChats,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) => {
  const navigate = useNavigate();
  return (
    <aside
      className="h-screen w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            {/* Sparkles Logo */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center justify-center"
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>

            {/* Logo Text */}
            <h1 className="text-2xl font-bold text-foreground">
              Deta
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-2 space-y-2 pb-2">
            <Button
              variant="ghost"
              onClick={onNewChat}
              className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              title="New Chat"
            >
              <MessageSquarePlus className="h-5 w-5" />
              <span>New Chat</span>
            </Button>

            <Button
              variant="ghost"
              onClick={onClearAllChats}
              className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-destructive transition-all"
              title="Clear All Chats"
            >
              <Trash2 className="h-5 w-5" />
              <span>Clear All</span>
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            <ConversationHistory
              currentConversationId={currentConversationId}
              onSelectConversation={onSelectConversation}
              onDeleteConversation={onDeleteConversation}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 space-y-2">
        <Button
          variant="ghost"
          onClick={() => navigate("/settings")}
          className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Button>
        <div className="px-2 text-xs text-center text-muted-foreground">
          Powered by LiskCell · LPT Engine
        </div>
      </div>
    </aside>
  );
};
