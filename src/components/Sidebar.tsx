import {
  MessageSquarePlus,
  Library,
  Sparkles,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface SidebarProps {
  onNewChat: () => void;
}

export const Sidebar = ({ onNewChat }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        width: isCollapsed ? "4rem" : "16rem",
      }}
      transition={{ duration: 0.3 }}
      className="h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div
          className={`flex items-center ${
            isCollapsed ? "flex-col gap-4 py-4" : "justify-between p-4"
          }`}
        >
          <div
            className={`flex items-center ${
              isCollapsed ? "flex-col gap-2" : "gap-2"
            }`}
          >
            {/* Sparkles Logo */}
            <motion.div className="relative flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
              />
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-8 w-8 text-primary relative z-10" />
              </motion.div>
            </motion.div>

            {/* Logo Text */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl font-bold text-foreground"
                >
                  Deta
                </motion.h1>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 rounded-full border border-sidebar-border hover:bg-sidebar-accent flex items-center justify-center p-0"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <PanelLeft className="h-4 w-4" />
            </motion.div>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-2 overflow-hidden flex flex-col">
          <Button
            variant="ghost"
            onClick={onNewChat}
            className={`w-full ${
              isCollapsed ? "justify-center" : "justify-start"
            } gap-3 hover:bg-sidebar-accent hover:text-primary transition-all`}
            title="New Chat"
          >
            <MessageSquarePlus className="h-5 w-5" />
            {!isCollapsed && <span>New Chat</span>}
          </Button>

          <Button
            variant="ghost"
            className={`w-full ${
              isCollapsed ? "justify-center" : "justify-start"
            } gap-3 hover:bg-sidebar-accent hover:text-primary transition-all`}
            title="Library"
          >
            <Library className="h-5 w-5" />
            {!isCollapsed && <span>Library</span>}
          </Button>
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            Powered by LiskCell · LPT Engine
          </div>
        )}
      </div>
    </motion.aside>
  );
};
