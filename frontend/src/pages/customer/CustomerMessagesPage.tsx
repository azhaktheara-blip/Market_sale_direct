import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  User,
  Sprout,
  CheckCheck,
  Package,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { inquiriesApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import type { Conversation, ChatMessage } from '../../types';

export const CustomerMessagesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isFarmerRole = user?.role === 'FARMER';

  const { data: rawConversations, isLoading: isConvsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => inquiriesApi.getConversations().then((res) => res.data),
  });

  const conversations: Conversation[] = Array.isArray(rawConversations)
    ? rawConversations
    : (rawConversations as any)?.results || [];

  // Set initial selected conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConvId) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  const { data: threadData, isLoading: isThreadLoading } = useQuery({
    queryKey: ['conversation-thread', selectedConvId],
    queryFn: () => inquiriesApi.getConversationMessages(selectedConvId!).then((res) => res.data),
    enabled: !!selectedConvId,
    refetchInterval: 4000, // Poll for live replies every 4s
  });

  const messages: ChatMessage[] = Array.isArray(threadData?.messages) ? threadData!.messages : [];

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (text: string) => inquiriesApi.sendMessage(selectedConvId!, text),
    onSuccess: (newMsg) => {
      queryClient.setQueryData(['conversation-thread', selectedConvId], (old: any) => {
        if (!old) return old;
        const prev = Array.isArray(old.messages) ? old.messages : [];
        return {
          ...old,
          messages: [...prev, newMsg.data],
        };
      });
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sendMutation.isPending || !selectedConvId) return;
    sendMutation.mutate(replyText.trim());
  };

  const selectedConv = threadData?.conversation || conversations.find((c) => c.id === selectedConvId);

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-extrabold text-stone-900 font-display">
          {isFarmerRole ? 'Buyer Inquiries & Wholesale Chat' : 'Grower Inquiries & Messages'}
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          {isFarmerRole
            ? 'Chat directly with restaurants, hotels, and individual buyers about harvest volumes.'
            : 'Communicate directly with local farmers and arrange custom harvest orders.'}
        </p>
      </div>

      {isConvsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Skeleton className="md:col-span-4 h-96 rounded-3xl" />
          <Skeleton className="md:col-span-8 h-96 rounded-3xl" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-8 h-8" />}
          title="No conversations yet"
          description={
            isFarmerRole
              ? 'When buyers ask questions about your produce or request wholesale dispatches, inquiries will appear here.'
              : "Click 'Ask Grower' on any produce or farm profile to start a direct inquiry."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden min-h-[580px]">
          {/* Left Column: Conversations List */}
          <div className="md:col-span-4 border-r border-stone-100 flex flex-col">
            <div className="p-4 border-b border-stone-100 font-bold text-xs text-stone-700 uppercase tracking-wider flex items-center justify-between">
              <span>Inbox ({conversations.length})</span>
              <span className="text-[10px] text-stone-400 font-normal">Auto-synced</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-stone-50 max-h-[500px]">
              {conversations.map((conv) => {
                const isSelected = selectedConvId === conv.id;
                const counterpartName = isFarmerRole
                  ? (conv.customer_name || 'Buyer')
                  : (conv.farmer?.farm_name || 'Grower');

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected ? 'bg-forest-50/80 border-l-4 border-forest-600' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-stone-900 text-xs truncate">
                        {counterpartName}
                      </div>
                      <span className="text-[10px] text-stone-400 shrink-0 font-medium flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {conv.last_message_at
                          ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>

                    <div className="text-xs text-forest-800 font-medium mt-0.5 truncate">
                      {conv.subject}
                    </div>

                    {conv.last_message && (
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-1">
                        {conv.last_message.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Thread */}
          <div className="md:col-span-8 flex flex-col justify-between p-6">
            {selectedConv ? (
              <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-sm shadow-xs">
                    {isFarmerRole ? <User className="w-5 h-5" /> : <Sprout className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">
                      {isFarmerRole
                        ? `Inquiry from ${selectedConv.customer_name || 'Buyer'}`
                        : (selectedConv.farmer?.farm_name || 'Grower')}
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      {selectedConv.farmer?.province ? `${selectedConv.farmer.province} • ` : ''}{selectedConv.subject}
                    </p>
                  </div>
                </div>

                {/* Attached Product Link if available */}
                {selectedConv.product && (
                  <Link
                    to={`/products/${selectedConv.product.slug}`}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-forest-50 text-xs font-bold text-stone-700 hover:text-forest-800 transition-colors"
                  >
                    <Package className="w-3.5 h-3.5 text-forest-600" />
                    <span className="truncate max-w-[120px]">{selectedConv.product.name}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ) : null}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[360px]">
              {isThreadLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-2/3 rounded-2xl" />
                  <Skeleton className="h-14 w-2/3 ml-auto rounded-2xl" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  No messages in this thread yet. Send a message below to begin.
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.is_me ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs ${
                        msg.is_me
                          ? 'bg-forest-700 text-white rounded-br-none shadow-xs'
                          : 'bg-stone-100 text-stone-800 rounded-bl-none'
                      }`}
                    >
                      <div className="font-bold text-[10px] opacity-75 mb-1">
                        {msg.sender_name}
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <div
                        className={`text-[9px] mt-1 flex items-center gap-1 ${
                          msg.is_me ? 'text-forest-200 justify-end' : 'text-stone-400'
                        }`}
                      >
                        <span>
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                        {msg.is_me && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSend} className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2">
              <input
                type="text"
                placeholder={isFarmerRole ? 'Reply to customer inquiry...' : 'Type your message to the grower...'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-stone-50 border border-stone-300 rounded-2xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={sendMutation.isPending}
                disabled={!replyText.trim() || sendMutation.isPending || !selectedConvId}
                rightIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
