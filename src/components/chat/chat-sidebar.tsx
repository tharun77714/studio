"use client";

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, XCircle, UploadCloud, Mic, MicOff } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function ChatSidebar() {
  const {
    isChatOpen,
    closeChat,
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    sendMessage,
    isLoadingConversations,
    isLoadingMessages,
    activeConversationTargetProfile,
  } = useChat();
  const { user } = useAuth();
  const { toast } = useToast();
  const [draft, setDraft] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeDisplayName =
    activeConversationTargetProfile?.business_name ||
    activeConversationTargetProfile?.full_name ||
    activeConversationTargetProfile?.email ||
    'Conversation';

  const isSpeechSupported =
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const handleMicToggle = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    if (!isSpeechSupported) {
      toast({ title: 'Speech not supported', description: 'Your browser does not support speech recognition.' });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Speech not supported', description: 'Speech recognition is unavailable.' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      toast({ title: 'Recording', description: 'Listening...' });
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDraft((prev) => (prev + ' ' + transcript).trim());
    };
    recognition.onerror = (event: any) => {
      setIsRecording(false);
      toast({ title: 'Speech error', description: event.error ?? 'Could not capture speech.', variant: 'destructive' });
    };
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeConversationId) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    setIsUploading(true);
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      const success = await sendMessage(dataUrl, 'image');
      setIsUploading(false);
      if (success) {
        setDraft('');
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast({ title: 'Upload failed', description: 'Could not read the selected file.', variant: 'destructive' });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    const success = await sendMessage(draft.trim(), 'text');
    setIsSendingMessage(false);
    if (success) {
      setDraft('');
    }
  };

  if (!isChatOpen) {
    return null;
  }

  return (
    <Card className="fixed right-0 top-16 bottom-0 z-40 flex h-[calc(100vh-4rem)] w-80 flex-col border-l shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between border-b p-4">
        <CardTitle className="flex items-center text-lg">
          <MessageSquare className="mr-2 h-5 w-5 text-primary" />
          Sparkle Chats
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={closeChat} className="h-7 w-7">
          <XCircle className="h-5 w-5" />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-0">
        <div className="border-b px-4 py-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Conversations</p>
          <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
            {isLoadingConversations && <div className="text-xs text-muted-foreground">Loading chats...</div>}
            {!isLoadingConversations && conversations.length === 0 && (
              <div className="text-xs text-muted-foreground">No chats yet. Open a store to start one.</div>
            )}
            {conversations.map((conversation) => {
              const displayName =
                conversation.otherParticipant.business_name ||
                conversation.otherParticipant.full_name ||
                conversation.otherParticipant.email ||
                'User';
              const isActive = conversation.id === activeConversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-xs transition ${
                    isActive ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{displayName}</span>
                    {conversation.unread_count > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                    {conversation.last_message_content || 'No messages yet'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!activeConversationId && (
            <div className="text-center text-xs text-muted-foreground">Select a conversation to start chatting.</div>
          )}
          {activeConversationId && (
            <div className="mb-3 text-xs font-semibold text-muted-foreground">Chat with {activeDisplayName}</div>
          )}
          {isLoadingMessages && activeConversationId && (
            <div className="text-xs text-muted-foreground">Loading messages...</div>
          )}
          {!isLoadingMessages &&
            messages.map((message) => {
              const isSender = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`mb-2 flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-xs ${
                      isSender ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}
                  >
                    {message.message_type === 'image' ? (
                      <img src={message.content} alt="Shared" className="mb-1 max-h-40 w-full object-contain" />
                    ) : (
                      <p>{message.content}</p>
                    )}
                    <p className="mt-1 text-[10px] opacity-70">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        <form className="border-t p-3" onSubmit={handleSubmit}>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent hover:bg-accent/40"
              disabled={!activeConversationId || isUploading}
              aria-label="Upload image"
            >
              {isUploading ? (
                <span className="text-[10px]">Uploading</span>
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
            </button>
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={activeConversationId ? 'Type a message...' : 'Select a chat first'}
              disabled={!activeConversationId || isSendingMessage}
            />
            <button
              type="button"
              onClick={handleMicToggle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent hover:bg-accent/40"
              disabled={!activeConversationId || !isSpeechSupported}
              aria-label="Record voice"
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <Button
              type="submit"
              size="icon"
              disabled={!activeConversationId || isSendingMessage || !draft.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
