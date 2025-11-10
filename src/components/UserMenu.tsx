import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NavigateFunction } from "react-router-dom";

interface UserMenuProps {
  navigate: NavigateFunction;
}

export const UserMenu = ({ navigate }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      setIsOpen(false);
    }
  };

  if (!user) {
    return (
      <Button 
        onClick={() => navigate("/auth")}
        className="w-full gradient-primary shadow-glow hover:shadow-neon transition-smooth"
      >
        Sign Up / Sign In
      </Button>
    );
  }

  const userInitial = user.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-sidebar-accent/50 transition-smooth"
      >
        <Avatar className="h-10 w-10 border-2 border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary">
            {userInitial}
          </AvatarFallback>
        </Avatar>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
            {user.user_metadata?.full_name || user.email}
          </p>
          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
            {user.email}
          </p>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-2 left-0 w-64 glass glow-border rounded-2xl shadow-neon p-2 z-50"
            >
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-sidebar-accent"
                onClick={() => {
                  navigate("/settings");
                  setIsOpen(false);
                }}
              >
                <SettingsIcon className="h-5 w-5" />
                <span>Settings</span>
              </Button>

              <div className="h-px bg-border my-2" />

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 hover:bg-destructive/10 text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                <span>Disconnect</span>
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
