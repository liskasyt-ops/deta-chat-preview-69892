import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, Send, Sparkles, Paperclip, Mic, X, Square, Code2, Search, Image as ImageIcon, Brain, BookOpen, Lightbulb, RefreshCw, Trash2, MicOff, Menu, Copy } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { conversationStorage } from "@/lib/conversationStorage";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[];
  isTyping?: boolean;
  sources?: Array<{ title: string; link: string; snippet: string }>;
}

const DAILY_QUESTIONS = [
  "What's the latest in AI technology?",
  "How can I improve my productivity?",
  "Explain quantum computing to me",
  "What are the best practices for web development?",
  "Help me brainstorm startup ideas",
  "How does blockchain work?",
  "What's new in space exploration?",
  "Teach me about machine learning",
  "What are the trends in cybersecurity?",
  "How can I learn to code effectively?",
];

const STATUS_ANIMATIONS = [
  { text: "Deta Coding", icon: Code2, gradient: "from-blue-500 via-cyan-500 to-teal-500" },
  { text: "Deta Searching", icon: Search, gradient: "from-purple-500 via-pink-500 to-rose-500" },
  { text: "Deta Generating Image", icon: ImageIcon, gradient: "from-orange-500 via-amber-500 to-yellow-500" },
  { text: "Deta Thinking", icon: Brain, gradient: "from-indigo-500 via-purple-500 to-pink-500" },
  { text: "Deta Explaining", icon: BookOpen, gradient: "from-green-500 via-emerald-500 to-teal-500" },
  { text: "Deta Giving Idea", icon: Lightbulb, gradient: "from-yellow-500 via-orange-500 to-red-500" },
];

export const Chat = () => {
  const isMobile = useIsMobile();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("LPT-3.5");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [detaStatus, setDetaStatus] = useState<string | null>(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [randomQuestions, setRandomQuestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto resize function
  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  useEffect(() => { autoResize(); }, [input]);

  // Initialize random questions
  useEffect(() => {
    const shuffled = [...DAILY_QUESTIONS].sort(() => Math.random() - 0.5);
    setRandomQuestions(shuffled.slice(0, 3));
  }, []);


  // Set status animation once based on input - no rotation
  useEffect(() => {
    if (!isLoading) return;
    
    // Detect what action is being performed based on the last input
    const lastMessage = messages[messages.length - 1];
    const inputLower = (lastMessage?.content || "").toLowerCase();
    let startIndex = 3; // Default to "Thinking"
    
    if (inputLower.includes("image") || inputLower.includes("תמונה") || inputLower.includes("picture") || inputLower.includes("draw") || inputLower.includes("generate")) {
      startIndex = 2; // "Generating Image"
    } else if (inputLower.includes("idea") || inputLower.includes("רעיון") || inputLower.includes("brainstorm") || inputLower.includes("suggest")) {
      startIndex = 5; // "Giving Idea"
    } else if (inputLower.includes("search") || inputLower.includes("חפש") || inputLower.includes("find")) {
      startIndex = 1; // "Searching"
    } else if (inputLower.includes("code") || inputLower.includes("קוד") || inputLower.includes("program") || inputLower.includes("function")) {
      startIndex = 0; // "Coding"
    } else if (inputLower.includes("explain") || inputLower.includes("הסבר") || inputLower.includes("what is") || inputLower.includes("מה זה")) {
      startIndex = 4; // "Explaining"
    }
    
    setCurrentStatusIndex(startIndex);
  }, [isLoading, messages]);

  useEffect(() => {
    // Only auto-scroll when a new message is added (not when user is typing)
    if (scrollRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only scroll if the last message is from assistant or if loading
      if (lastMessage.role === "assistant" || isLoading) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, isLoading]);

  const createNewConversation = useCallback(async () => {
    const newConversation = conversationStorage.create();
    setCurrentConversationId(newConversation.id);
    setMessages([]);
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    const conversation = conversationStorage.getById(conversationId);
    if (conversation) {
      setCurrentConversationId(conversation.id);
      setMessages(conversation.messages);
    }
  }, []);

  const saveMessage = async (message: Message) => {
    if (currentConversationId) {
      const conversation = conversationStorage.getById(currentConversationId);
      if (conversation) {
        conversationStorage.update(currentConversationId, [...conversation.messages, message]);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Convert images to base64 for public access (no storage needed)
    toast.info("Converting images...", { id: 'convert' });
    try {
      const imagePromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
      
      const base64Images = await Promise.all(imagePromises);
      setUploadedImages(prev => [...prev, ...base64Images]);
      toast.success(`${base64Images.length} image${base64Images.length > 1 ? 's' : ''} ready!`, { id: 'convert' });
    } catch (error) {
      toast.error("Failed to process images", { id: 'convert' });
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedImages.length === 0) || isLoading) return;
    
    // Create new conversation if none exists
    if (!currentConversationId) {
      createNewConversation();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Everyone has unlimited image generation - no restrictions

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input || "Check these images",
      timestamp: new Date(),
      images: uploadedImages.length > 0 ? uploadedImages : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);

    const currentInput = input;
    setInput("");
    setUploadedImages([]);
    setIsLoading(true);
    setCurrentStatusIndex(0);
    setDetaStatus(STATUS_ANIMATIONS[0].text);

    abortControllerRef.current = new AbortController();

    let assistantContent = "";
    const assistantImages: string[] = [];
    let assistantSources: Array<{ title: string; link: string; snippet: string }> = [];

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: assistantContent, images: assistantImages, sources: assistantSources }
              : m
          );
        }
        return [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: assistantContent, timestamp: new Date(), images: assistantImages, sources: assistantSources }
        ];
      });
    };

    try {
      await streamChat({
        messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content })),
        model: selectedModel,
        abortSignal: abortControllerRef.current?.signal,
        onDelta: upsertAssistant,
        onImage: (imgUrl) => {
          // No restrictions - everyone can generate unlimited images
          assistantImages.push(imgUrl);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, images: [...assistantImages] } : m);
            }
            return prev;
          });
        },
        onSources: (sources) => {
          assistantSources = sources;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, sources } : m);
            }
            return prev;
          });
        },
        onDone: async () => {
          setIsLoading(false);
          setDetaStatus(null);
          abortControllerRef.current = null;
          await saveMessage({ id: Date.now().toString(), role: "assistant", content: assistantContent, timestamp: new Date(), images: assistantImages.length ? assistantImages : undefined, sources: assistantSources.length ? assistantSources : undefined });
        },
        onError: (error) => {
          toast.error(error);
          setIsLoading(false);
          setDetaStatus(null);
          abortControllerRef.current = null;
          setMessages(prev => prev.slice(0, -1));
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') toast.error("שגיאה בשליחת ההודעה");
      setIsLoading(false);
      setDetaStatus(null);
      abortControllerRef.current = null;
      setMessages(prev => prev.slice(0, -1));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());

        // Convert to base64 and send to transcription
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(",")[1];
          if (!base64Audio) return;

          toast.loading("Transcribing audio...", { id: "transcribe" });

          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ audio: base64Audio }),
            });

            const data = await response.json();
            if (data.text) {
              setInput(data.text);
              toast.success("Transcription complete!", { id: "transcribe" });
            } else {
              throw new Error("No transcription returned");
            }
          } catch (error) {
            toast.error("Failed to transcribe audio", { id: "transcribe" });
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording... Click again to stop");
    } catch (error) {
      toast.error("Failed to access microphone");
    }
  };

  const handleRegenerateResponse = async () => {
    if (isLoading || messages.length < 2) return;

    // Find the last user message
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) return;

    // Remove all messages after the last user message
    const newMessages = messages.slice(0, lastUserMessageIndex + 1);
    setMessages(newMessages);

    // Re-send the last user message
    const lastUserMessage = messages[lastUserMessageIndex];
    setInput("");
    setIsLoading(true);
    setCurrentStatusIndex(0);
    setDetaStatus(STATUS_ANIMATIONS[0].text);

    abortControllerRef.current = new AbortController();

    let assistantContent = "";
    const assistantImages: string[] = [];
    let assistantSources: Array<{ title: string; link: string; snippet: string }> = [];

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: assistantContent, images: assistantImages, sources: assistantSources }
              : m
          );
        }
        return [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: assistantContent, timestamp: new Date(), images: assistantImages, sources: assistantSources }
        ];
      });
    };

    try {
      await streamChat({
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        model: selectedModel,
        abortSignal: abortControllerRef.current?.signal,
        onDelta: upsertAssistant,
        onImage: (imgUrl) => {
          // No restrictions - everyone can generate unlimited images
          assistantImages.push(imgUrl);
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, images: [...assistantImages] } : m);
            }
            return prev;
          });
        },
        onSources: (sources) => {
          assistantSources = sources;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, sources } : m);
            }
            return prev;
          });
        },
        onDone: async () => {
          setIsLoading(false);
          setDetaStatus(null);
          abortControllerRef.current = null;
          await saveMessage({ id: Date.now().toString(), role: "assistant", content: assistantContent, timestamp: new Date(), images: assistantImages.length ? assistantImages : undefined, sources: assistantSources.length ? assistantSources : undefined });
        },
        onError: (error) => {
          toast.error(error);
          setIsLoading(false);
          setDetaStatus(null);
          abortControllerRef.current = null;
          setMessages(prev => prev.slice(0, -1));
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') toast.error("Failed to regenerate response");
      setIsLoading(false);
      setDetaStatus(null);
      abortControllerRef.current = null;
      setMessages(prev => prev.slice(0, -1));
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const updatedMessages = messages.filter(m => m.id !== messageId);
      setMessages(updatedMessages);
      
      if (currentConversationId) {
        conversationStorage.update(currentConversationId, updatedMessages);
      }
      
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleClearAllChats = useCallback(() => {
    if (confirm("Are you sure you want to delete all conversations?")) {
      conversationStorage.deleteAll();
      setMessages([]);
      setCurrentConversationId(null);
      toast.success("All conversations deleted");
    }
  }, []);

  const handleDeleteConversation = useCallback((id: string) => {
    conversationStorage.delete(id);
    if (currentConversationId === id) {
      setMessages([]);
      setCurrentConversationId(null);
    }
    toast.success("Conversation deleted");
  }, [currentConversationId]);

  const isEmpty = messages.length === 0;
  const currentStatus = STATUS_ANIMATIONS[currentStatusIndex];

  // Memoize sidebar callbacks
  const handleNewChat = useCallback(() => {
    createNewConversation();
    if (isMobile) setMobileMenuOpen(false);
  }, [createNewConversation, isMobile]);

  const handleSelectConversation = useCallback((id: string) => {
    loadConversation(id);
    if (isMobile) setMobileMenuOpen(false);
  }, [loadConversation, isMobile]);

  // SidebarContent wrapper
  const SidebarContent = () => (
    <Sidebar
      onNewChat={handleNewChat}
      onClearAllChats={handleClearAllChats}
      currentConversationId={currentConversationId}
      onSelectConversation={handleSelectConversation}
      onDeleteConversation={handleDeleteConversation}
    />
  );

  return (
    <div className="flex h-screen bg-gradient-to-b from-black to-purple-900">
      {/* Desktop Sidebar */}
      {!isMobile && <SidebarContent />}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          modal={false}
        >
          <DrawerContent className="h-[85vh]">
            <DrawerHeader className="flex items-center justify-between px-4">
              <div className="sr-only">
                <DrawerTitle>Menu</DrawerTitle>
                <DrawerDescription>Navigation and chat history</DrawerDescription>
              </div>
              {/* כפתור סגירה ברור בתוך ה־Drawer בשביל ux במובייל */}
              <div className="ml-auto">
                <Button size="icon" variant="ghost" onClick={() => setMobileMenuOpen(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DrawerHeader>
            <SidebarContent />
          </DrawerContent>
        </Drawer>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="glass border-b border-border/50 px-3 md:px-6 py-3 md:py-4"
        >
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-2 md:gap-3">
              {/* Mobile Menu Button */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  className="hover:bg-primary/20 h-8 w-8 md:h-10 md:w-10"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}

              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="flex items-center gap-2">
                <Zap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[100px] md:w-[140px] glow-border bg-card/50 text-xs md:text-sm h-8 md:h-10">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LPT-1">LPT-1 ⚙️</SelectItem>
                    <SelectItem value="LPT-1.5">LPT-1.5 ⚡</SelectItem>
                    <SelectItem value="LPT-2">LPT-2 🧠</SelectItem>
                    <SelectItem value="LPT-2.5">LPT-2.5 💬</SelectItem>
                    <SelectItem value="LPT-3">LPT-3 🌐</SelectItem>
                    <SelectItem value="LPT-3.5">LPT-3.5 🚀</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} className="h-2 w-2 rounded-full bg-primary shadow-neon" />
            </div>
          </div>
        </motion.header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-2 md:px-4">
          <div className="mx-auto max-w-4xl py-4 md:py-8">
            <AnimatePresence mode="popLayout">
              {isEmpty ? (
                <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="mb-8">
                    <Sparkles className="h-20 w-20 text-primary shadow-neon" />
                  </motion.div>
                  <motion.h1 className="text-3xl md:text-5xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent px-4 md:px-0">
                    Where should we begin?
                  </motion.h1>
                  <div className="mt-6 md:mt-8 space-y-3 max-w-2xl px-4 md:px-0">
                    <p className="text-xs md:text-sm text-muted-foreground mb-4">💡 Daily Questions</p>
                    {randomQuestions.map((question, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Button
                          onClick={() => {
                            setInput(question);
                            setTimeout(() => handleSend(), 100);
                          }}
                          variant="outline"
                          className="w-full text-left justify-start glass glow-border hover:bg-primary/10 transition-smooth"
                        >
                          <Sparkles className="mr-2 h-4 w-4 text-primary" />
                          {question}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div key={message.id} className="relative group">
                      <ChatMessage message={message} index={index} />
                      {message.role === "assistant" && (
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyMessage(message.content)}
                            disabled={isLoading}
                            className="text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRegenerateResponse}
                            disabled={isLoading}
                            className="text-xs"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Regenerate
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMessage(message.id)}
                            disabled={isLoading}
                            className="text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AnimatePresence>
            {isLoading && detaStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className={`p-2 rounded-lg bg-gradient-to-r ${currentStatus.gradient}`}
                >
                  <currentStatus.icon className="h-5 w-5 text-white" />
                </motion.div>
                <div className="flex flex-col">
                  <span className={`text-sm font-medium bg-gradient-to-r ${currentStatus.gradient} bg-clip-text text-transparent`}>
                    {currentStatus.text}
                  </span>
                  <span className="text-xs text-muted-foreground">Processing your request...</span>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="glass border-t border-border/50 px-4 py-6">
          <div className="mx-auto max-w-4xl">
            {uploadedImages.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img src={img} alt={`Upload preview ${idx + 1}`} className="h-20 w-20 object-cover rounded-xl glass glow-border" />
                    <Button size="icon" variant="ghost" onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive hover:bg-destructive/80">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative flex items-center gap-3 p-3 rounded-2xl glass glow-border shadow-neon">
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImages}>
                {isUploadingImages ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Paperclip className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <Paperclip className="h-5 w-5" />
                )}
              </Button>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  // Prevent drawer from auto-closing when typing
                  if (isMobile && textareaRef.current) {
                    textareaRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }
                }}
                placeholder="Ask Anything..."
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 resize-none min-h-[40px] max-h-[200px] overflow-y-auto"
                disabled={isLoading}
                rows={1}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleVoiceInput}
                className={isRecording ? "text-destructive animate-pulse" : ""}
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={isLoading ? undefined : handleSend} size="icon" className={isLoading ? "bg-destructive hover:bg-destructive/90 shadow-neon transition-smooth" : "gradient-primary shadow-neon transition-smooth hover:shadow-glow"}>
                  {isLoading ? <Square className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
