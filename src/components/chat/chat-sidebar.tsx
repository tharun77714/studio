"use client";

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, XCircle, UploadCloud, ChevronLeft, Sparkles, Mic, MicOff } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 350);
    return () => clearTimeout(timeout);
  }, [messages, isChatOpen, activeConversationId]);

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
      let errorMsg = event.error ?? 'Could not capture speech.';
      if (event.error === 'network') {
        errorMsg = 'Network error: Browsers like Brave strictly block speech recognition. Please try using Chrome or Edge.';
      }
      toast({ title: 'Speech error', description: errorMsg, variant: 'destructive' });
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

    if (file.size > 3 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Please select an image smaller than 3MB.', variant: 'destructive' });
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
    <Card className="fixed right-0 top-16 bottom-0 z-50 flex h-[calc(100vh-4rem)] w-[400px] flex-col border-l border-white/20 shadow-2xl bg-background/80 backdrop-blur-2xl animate-in slide-in-from-right-8 duration-300 rounded-none rounded-tl-2xl">
      {/* Premium Header */}
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 px-6 py-4 bg-gradient-to-r from-transparent to-primary/5 shrink-0">
        <div className="flex items-center gap-2">
          {activeConversationId ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setActiveConversationId(null)} 
              className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          )}
          <CardTitle className="flex items-center text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            {activeConversationId ? activeDisplayName : 'Sparkle Chats'}
          </CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={closeChat} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
          <XCircle className="h-5 w-5" />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-0 overflow-hidden p-0 relative">
        
        {/* VIEW 1: Conversations List */}
        {!activeConversationId && (
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-background/50 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4 px-2">Your Conversations</p>
            <div className="flex flex-col gap-3">
              {isLoadingConversations && <div className="text-sm text-muted-foreground animate-pulse px-2">Loading chats...</div>}
              {!isLoadingConversations && conversations.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center text-center opacity-60">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground px-4">No chats yet. Open a store and click 'Chat with Store' to start one.</p>
                </div>
              )}
              {conversations.map((conversation) => {
                const displayName =
                  conversation.otherParticipant.business_name ||
                  conversation.otherParticipant.full_name ||
                  conversation.otherParticipant.email ||
                  'User';
                
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className="w-full rounded-2xl px-5 py-4 text-left text-sm transition-all duration-300 group flex flex-col gap-2 border bg-card/60 hover:bg-accent hover:border-primary/30 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-base truncate text-foreground group-hover:text-primary transition-colors">
                        {displayName}
                      </span>
                      {conversation.unread_count > 0 && (
                        <span className="shrink-0 ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm animate-in zoom-in">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground/80 leading-relaxed">
                      {conversation.last_message_content || 'No messages yet'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: Messages Area */}
        {activeConversationId && (
          <div className="flex flex-col h-full w-full animate-in slide-in-from-right-4 duration-200">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-gradient-to-b from-transparent to-accent/5">
              
              {isLoadingMessages && (
                <div className="flex justify-center my-4">
                  <div className="h-2 w-2 bg-primary rounded-full animate-ping"></div>
                </div>
              )}
              
              <div className="space-y-4">
                {!isLoadingMessages &&
                  messages.map((message) => {
                    const isSender = message.sender_id === user?.id;
                    return (
                      <div key={message.id} className={cn("flex w-full", isSender ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "relative max-w-[80%] px-4 py-2.5 text-[13px] shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2",
                            isSender 
                              ? "bg-gradient-to-br from-primary to-purple-600 text-white rounded-2xl rounded-br-sm shadow-[0_4px_14px_0_rgba(var(--primary),0.3)]" 
                              : "bg-card border border-white/20 text-foreground rounded-2xl rounded-bl-sm backdrop-blur-md"
                          )}
                        >
                          {message.message_type === 'image' ? (
                            <img 
                              src={message.content} 
                              alt="Shared" 
                              className="mb-2 max-h-48 w-full rounded-xl object-cover shadow-sm"
                              onLoad={() => {
                                const timeout = setTimeout(() => {
                                  messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                                }, 50);
                                return () => clearTimeout(timeout);
                              }} 
                            />
                          ) : (
                            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          )}
                          <div className={cn(
                            "mt-1 text-[9px] font-medium opacity-60 flex items-center",
                            isSender ? "justify-end text-white/80" : "justify-start text-muted-foreground"
                          )}>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                <div ref={messagesEndRef} className="h-2" />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background/50 backdrop-blur-xl border-t border-white/10 shrink-0 relative z-10">
              <form 
                onSubmit={handleSubmit}
                className="flex items-center gap-2 rounded-full border border-border/50 bg-accent/30 p-1.5 shadow-inner backdrop-blur-md transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:bg-accent/50"
              >
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/50 text-muted-foreground transition hover:bg-primary hover:text-primary-foreground shadow-sm"
                  disabled={isUploading}
                  aria-label="Upload image"
                >
                  {isUploading ? (
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4 transition-transform group-hover:scale-110" />
                  )}
                </button>
                
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type your message..."
                  disabled={isSendingMessage}
                  className="flex-1 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/70"
                />
                
                <button
                  type="button"
                  onClick={handleMicToggle}
                  className={cn(
                    "group flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition shadow-sm",
                    isRecording 
                      ? "bg-red-500 text-white animate-pulse" 
                      : "bg-background/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  disabled={!isSpeechSupported}
                  aria-label="Record voice"
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 transition-transform group-hover:scale-110" />}
                </button>
                
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] hover:scale-105"
                  disabled={isSendingMessage || !draft.trim()}
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
