interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  images?: string[];
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

const STORAGE_KEY = "deta_conversations";

export const conversationStorage = {
  // Get all conversations
  getAll(): Conversation[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Get a specific conversation
  get(id: string): Conversation | null {
    const conversations = this.getAll();
    return conversations.find(c => c.id === id) || null;
  },

  // Save a conversation
  save(conversation: Conversation): void {
    const conversations = this.getAll();
    const index = conversations.findIndex(c => c.id === conversation.id);
    
    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  },

  // Update conversation messages
  updateMessages(id: string, messages: Message[]): void {
    const conversation = this.get(id);
    if (conversation) {
      conversation.messages = messages;
      conversation.updated_at = new Date().toISOString();
      
      // Update title if it's still "New Conversation"
      if (conversation.title === "New Conversation" && messages.length > 0) {
        const firstUserMessage = messages.find(m => m.role === "user");
        if (firstUserMessage) {
          conversation.title = firstUserMessage.content.slice(0, 50);
        }
      }
      
      this.save(conversation);
    }
  },

  // Create new conversation
  create(): Conversation {
    const conversation: Conversation = {
      id: Date.now().toString(),
      title: "New Conversation",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    };
    
    this.save(conversation);
    return conversation;
  },

  // Delete conversation
  delete(id: string): void {
    const conversations = this.getAll().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  },
};
