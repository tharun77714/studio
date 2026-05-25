"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ConversationView, Message } from '@/types/chat';
import type { Profile } from './AuthContext';
import { useAuth } from '@/hooks/useAuth';
import {
  getMessagesForConversationAction,
  getOrCreateConversationAction,
  listUserConversationsAction,
  markMessagesAsReadAction,
  sendMessageAction,
  updateLastSeenAction,
} from '@/lib/actions/chat-actions';

interface ChatContextType {
  isChatOpen: boolean;
  isChatMaximized: boolean;
  toggleChat: () => void;
  closeChat: () => void;
  toggleMaximizeChat: () => void;
  openChatWithUser: (targetUserId: string) => Promise<void>;
  activeConversationId: string | null;
  setActiveConversationId: (conversationId: string | null) => void;
  conversations: ConversationView[];
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  sendMessage: (content: string, type?: 'text' | 'image') => Promise<void>;
  fetchConversations: (silent?: boolean) => Promise<void>;
  activeConversationTargetProfile: Pick<Profile, 'id' | 'full_name' | 'business_name' | 'role' | 'email' | 'last_seen' | 'is_online'> | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationTargetProfile, setActiveConversationTargetProfile] = useState<
    Pick<Profile, 'id' | 'full_name' | 'business_name' | 'role' | 'email' | 'last_seen' | 'is_online'> | null
  >(null);
  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const fetchConversations = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setIsLoadingConversations(true);
    const result = await listUserConversationsAction();
    if (result.error) {
      toast({ title: 'Chat error', description: result.error.message, variant: 'destructive' });
    } else if (result.data) {
      setConversations(result.data);
    }
    if (!silent) setIsLoadingConversations(false);
  }, [toast, user]);

  const fetchMessages = useCallback(
    async (conversationId: string, silent = false) => {
      if (!user) return;
      if (!silent) setIsLoadingMessages(true);
      const result = await getMessagesForConversationAction(conversationId);
      if (result.error) {
        toast({ title: 'Chat error', description: result.error.message, variant: 'destructive' });
      } else if (result.data) {
        setMessages(result.data);
      }
      await markMessagesAsReadAction(conversationId);
      if (!silent) setIsLoadingMessages(false);
    },
    [toast, user]
  );

  useEffect(() => {
    if (!isChatOpen || !user) {
      return;
    }
    fetchConversations();
  }, [fetchConversations, isChatOpen, user]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setActiveConversationTargetProfile(null);
      return;
    }
    const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
    setActiveConversationTargetProfile(activeConversation?.otherParticipant ?? null);
  }, [activeConversationId, conversations]);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }
    fetchMessages(activeConversationId);
  }, [activeConversationId, fetchMessages]);

  useEffect(() => {
    if (!user || !isChatOpen) return;

    // Polling for messages and conversations
    const pollInterval = setInterval(() => {
      fetchConversations(true);
      if (activeConversationId) {
        fetchMessages(activeConversationId, true);
      }
    }, 5000); // Poll every 5 seconds

    // Polling for presence
    const presenceInterval = setInterval(() => {
      updateLastSeenAction();
    }, 30000); // Update presence every 30 seconds

    updateLastSeenAction(); // Initial call

    return () => {
      clearInterval(pollInterval);
      clearInterval(presenceInterval);
    };
  }, [user, isChatOpen, activeConversationId, fetchConversations, fetchMessages]);


  const value = useMemo<ChatContextType>(
    () => ({
      isChatOpen,
      isChatMaximized,
      toggleChat: () => setIsChatOpen((prev) => !prev),
      closeChat: () => {
        setIsChatOpen(false);
        setIsChatMaximized(false);
      },
      toggleMaximizeChat: () => setIsChatMaximized((prev) => !prev),
      openChatWithUser: async (targetUserId: string) => {
        if (!user) {
          toast({ title: 'Please sign in', description: 'Sign in to start a chat.' });
          return;
        }
        setIsChatOpen(true);
        const result = await getOrCreateConversationAction(targetUserId);
        if (result.error) {
          toast({ title: 'Chat error', description: result.error.message, variant: 'destructive' });
          return;
        }
        if (result.data) {
          await fetchConversations();
          setActiveConversationId(result.data.id);
        }
      },
      activeConversationId,
      setActiveConversationId,
      conversations,
      messages,
      isLoadingConversations,
      isLoadingMessages,
      sendMessage: async (content: string, type: 'text' | 'image' = 'text') => {
        if (!activeConversationId) {
          toast({ title: 'Select a chat', description: 'Choose a conversation first.' });
          return false;
        }
        if (!content.trim() || !user) {
          return false;
        }
        
        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
          id: tempId,
          conversation_id: activeConversationId,
          sender_id: user.id,
          receiver_id: '',
          content: content.trim(),
          message_type: type,
          created_at: new Date().toISOString(),
          is_read: true,
        };

        // Optimistic UI update: show message instantly
        setMessages((prev) => [...prev, tempMessage]);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === activeConversationId
              ? {
                  ...conversation,
                  last_message_content: content.trim(),
                  last_message_at: tempMessage.created_at,
                  unread_count: 0,
                }
              : conversation
          )
        );

        // Run server action in background
        const result = await sendMessageAction(activeConversationId, content.trim(), type);
        
        if (result.error) {
          // Revert optimistic update on failure
          setMessages((prev) => prev.filter(m => m.id !== tempId));
          toast({ title: 'Chat error', description: result.error.message, variant: 'destructive' });
          return false;
        }
        
        const newMessage = result.data;
        if (!newMessage) {
          setMessages((prev) => prev.filter(m => m.id !== tempId));
          return false;
        }
        
        // Replace temp message with real message
        setMessages((prev) => prev.map(m => m.id === tempId ? newMessage : m));
        
        await markMessagesAsReadAction(activeConversationId);
        return true;
      },
      fetchConversations,
      activeConversationTargetProfile,
    }),
    [
      activeConversationId,
      activeConversationTargetProfile,
      conversations,
      fetchConversations,
      fetchMessages,
      isChatMaximized,
      isChatOpen,
      isLoadingConversations,
      isLoadingMessages,
      messages,
      toast,
      user,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  return context;
}
