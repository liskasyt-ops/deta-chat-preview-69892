import { useState, useEffect } from "react";
import {
  MessageSquarePlus,
  Sparkles,
  Settings,
  Library,
  Bot,
  LogOut,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  id: string;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SidebarProps {
  onNewChat: () => void;
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  isAuthenticated: boolean;
  refreshTrigger?: number;
}

export const Sidebar = memo(({ 
  onNewChat, 
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  isAuthenticated,
  refreshTrigger,
}: SidebarProps) => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  // Load conversations from Supabase
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, refreshTrigger]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // First delete all messages in the conversation
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", id);

      // Then delete the conversation
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setConversations(prev => prev.filter(c => c.id !== id));
      onDeleteConversation(id);
      toast.success("Conversation deleted");
    } catch (error: any) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  return (
    <aside
      className="h-screen w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col justify-between"
    >
      <div className="flex flex-col h-full overflow-hidden">
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
        <div className="px-2 space-y-2 pb-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              onClick={onNewChat}
              className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              title="New Chat"
            >
              <MessageSquarePlus className="h-5 w-5" />
              <span>New Chat</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              title="Library"
            >
              <Library className="h-5 w-5" />
              <span>Library</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all relative"
              title="AI Agent"
            >
              <Bot className="h-5 w-5" />
              <span>AI Agent</span>
              <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
            </Button>
          </motion.div>
        </div>

        {/* Separator */}
        <div className="px-4 py-2">
          <div className="border-t border-sidebar-border" />
        </div>

        {/* Chat History Title */}
        <div className="px-4 py-2">
          <span className="text-sm text-muted-foreground">Chat History</span>
        </div>

        {/* Chat History List */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-2">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv, index) => (
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
                    <span className="truncate text-left flex-1">
                      {conv.title || "New Conversation"}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-2 space-y-2">
        {isAuthenticated && (
          <>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                onClick={() => navigate("/settings")}
                className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-primary transition-all"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start gap-3 hover:bg-sidebar-accent hover:text-destructive transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </Button>
            </motion.div>
          </>
        )}
        
        <div className="px-2 text-xs text-center text-muted-foreground">
          Powered by LiskCell · LPT Engine
        </div>
      </div>
    </aside>
  );
});
