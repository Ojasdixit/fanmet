import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, Button, Avatar } from '@fanmeet/ui';
import { MoreVertical, MoreHorizontal, Reply, Copy, Trash2, Flag, UserMinus2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useAuth } from '../../contexts/AuthContext';

type StatusType = 'online' | 'dnd' | 'offline';

interface Participant {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  status?: StatusType;
}

interface ConversationSummary {
  id: string; // This will be the other user's ID
  participant: Participant;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

const STATUS_COLORS: Record<StatusType, string> = {
  online: '#22c55e',
  dnd: '#ef4444',
  offline: '#9ca3af',
};

function StatusBadge({ status }: { status: StatusType }) {
  return (
    <span
      aria-label={status}
      className="inline-block h-2.5 w-2.5 rounded-full border-2 border-white shadow-sm"
      style={{ backgroundColor: STATUS_COLORS[status] }}
    />
  );
}

export function FanMessages() {
  const [draft, setDraft] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { messages, sendMessage, markMessageAsRead } = useNotifications();
  const { user } = useAuth();

  // Group messages into conversations
  const conversations = useMemo(() => {
    if (!user || !messages) return [];

    const conversationMap = new Map<string, ConversationSummary>();

    messages.forEach((msg) => {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const otherUserName = msg.sender_id === user.id ? msg.receiver_display_name : msg.sender_display_name;
      const otherUserUsername = msg.sender_id === user.id ? msg.receiver_username : msg.sender_username;

      const existing = conversationMap.get(otherUserId);
      const isUnread = !msg.read && msg.receiver_id === user.id;

      if (!existing) {
        conversationMap.set(otherUserId, {
          id: otherUserId,
          participant: {
            id: otherUserId,
            name: otherUserName || 'Unknown User',
            username: otherUserUsername || 'unknown',
            avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${otherUserName || 'User'}`,
            status: 'offline', // We don't have real-time status yet
          },
          lastMessage: msg.message,
          lastTime: msg.created_at,
          unread: isUnread ? 1 : 0,
        });
      } else {
        // Update last message if this one is newer
        if (new Date(msg.created_at) > new Date(existing.lastTime)) {
          existing.lastMessage = msg.message;
          existing.lastTime = msg.created_at;
        }
        if (isUnread) {
          existing.unread += 1;
        }
      }
    });

    return Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );
  }, [messages, user]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const activeMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          (m.sender_id === user?.id && m.receiver_id === activeConversationId) ||
          (m.sender_id === activeConversationId && m.receiver_id === user?.id)
      ),
    [messages, user, activeConversationId]
  );

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (activeConversationId && user) {
      const unreadMessages = activeMessages.filter(
        (m) => !m.read && m.receiver_id === user.id
      );
      unreadMessages.forEach((m) => markMessageAsRead(m.id));
    }
  }, [activeConversationId, activeMessages, user, markMessageAsRead]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !activeConversationId) return;

    try {
      await sendMessage(activeConversationId, draft);
      setDraft('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col gap-4 md:flex-row">
      <div
        className={`flex w-full flex-col gap-3 md:w-80 ${activeConversation ? 'hidden md:flex' : 'flex'
          }`}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[#212529]">Messages</h1>
          <p className="text-sm text-[#6C757D]">
            Chat with creators after your meets.
          </p>
        </div>

        <Card className="flex h-full min-h-[260px] flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-[#E9ECEF] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#212529]">Conversations</h2>
              <p className="text-xs text-[#6C757D]">Tap a creator to open your chat.</p>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 gap-2 p-0">
            <div className="flex-1 overflow-y-auto p-2">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`mb-2 flex w-full items-center gap-3 rounded-[12px] border px-3 py-2 text-left text-sm transition-colors ${isActive
                      ? 'border-[#C045FF] bg-[#F4E6FF] text-[#140423]'
                      : 'border-[#E9ECEF] bg-white text-[#212529] hover:border-[#C045FF]/50 hover:bg-[#F8F5FF]'
                      }`}
                  >
                    <Avatar
                      src={conversation.participant.avatar}
                      alt={conversation.participant.name}
                      initials={conversation.participant.name.charAt(0)}
                      size="sm"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold">
                          {conversation.participant.name}
                        </span>
                        <span className="whitespace-nowrap text-[11px] text-[#6C757D]">
                          {format(new Date(conversation.lastTime), 'h:mm a')}
                        </span>
                      </div>
                      <span className="mt-0.5 line-clamp-1 text-[12px] text-[#6C757D]">
                        {conversation.lastMessage}
                      </span>
                    </div>
                    {conversation.unread > 0 && (
                      <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C045FF] px-1 text-[11px] font-semibold text-white">
                        {conversation.unread}
                      </span>
                    )}
                  </button>
                );
              })}
              {conversations.length === 0 && (
                <p className="pt-4 text-center text-xs text-[#6C757D]">
                  No conversations yet. Join a FanMeet to start chatting with creators.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card
        elevated
        className={`flex h-full w-full flex-1 flex-col overflow-hidden ${activeConversation ? 'flex' : 'hidden md:flex'
          }`}
      >
        {activeConversation ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-[#E9ECEF] bg-white/80 py-3 backdrop-blur">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E9ECEF] bg-white text-sm text-[#343A40] md:hidden"
                  onClick={() => setActiveConversationId(null)}
                >
                  ←
                </button>
                <Avatar
                  src={activeConversation.participant.avatar}
                  alt={activeConversation.participant.name}
                  initials={activeConversation.participant.name.charAt(0)}
                  size="sm"
                />
                <div className="flex flex-col">
                  <div className="text-sm font-semibold text-[#212529]">
                    {activeConversation.participant.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#6C757D]">
                    {activeConversation.participant.status && (
                      <StatusBadge status={activeConversation.participant.status} />
                    )}
                    <span>
                      {activeConversation.participant.status === 'online'
                        ? 'Online now'
                        : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-[#E9ECEF] bg-white text-[#6C757D]"
                >
                  <UserMinus2 className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-[#E9ECEF] bg-white text-[#6C757D]"
                >
                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
              <div className="flex-1 space-y-4 overflow-y-auto bg-[#F8F9FA] p-4">
                {activeMessages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;

                  return (
                    <div
                      key={msg.id}
                      className={`group my-2 flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`flex max-w-[80%] items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'
                          }`}
                      >
                        <Avatar
                          src={
                            isMe
                              ? `https://api.dicebear.com/9.x/initials/svg?seed=${user?.user_metadata?.full_name || 'Me'}`
                              : activeConversation.participant.avatar
                          }
                          alt={isMe ? 'Me' : activeConversation.participant.name}
                          initials={isMe ? 'Me' : activeConversation.participant.name.charAt(0)}
                          size="sm"
                        />
                        <div>
                          <div
                            className={`rounded-2xl px-3 py-2 text-sm ${isMe
                              ? 'border-2 border-transparent text-[#050014] shadow-[0_10px_30px_rgba(0,0,0,0.25)]'
                              : 'border border-[#E9ECEF] bg-white text-[#212529]'
                              }`}
                            style={isMe ? { background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #A78BFA, #C084FC, #E0E7FF) border-box' } : undefined}
                          >
                            {msg.message}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6C757D]">
                            <time dateTime={msg.created_at}>
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </time>
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[#6C757D] shadow-sm"
                              >
                                <Reply className="h-3 w-3" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[#6C757D] shadow-sm"
                              >
                                <Copy className="h-3 w-3" aria-hidden="true" />
                              </button>
                              {!isMe && (
                                <button
                                  type="button"
                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[#E63946] shadow-sm"
                                >
                                  <Flag className="h-3 w-3" aria-hidden="true" />
                                </button>
                              )}
                              {isMe && (
                                <button
                                  type="button"
                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[#E63946] shadow-sm"
                                >
                                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                                </button>
                              )}
                              <button
                                type="button"
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-[#6C757D] shadow-sm"
                              >
                                <MoreHorizontal className="h-3 w-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#E9ECEF] bg-white p-3">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Type your message..."
                    className="h-11 flex-1 rounded-[12px] border-2 border-[#E9ECEF] bg-white px-4 text-sm text-[#212529] placeholder:text-[#ADB5BD] focus:border-[#C045FF] focus:shadow-[0_0_0_3px_rgba(192,69,255,0.18)] focus:outline-none"
                  />
                  <Button
                    type="submit"
                    size="md"
                    disabled={!draft.trim()}
                    className="px-5 text-sm"
                  >
                    Send
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex h-full flex-1 items-center justify-center bg-[#F8F9FA] p-6 text-center text-sm text-[#6C757D]">
            <p className="max-w-xs">
              Select a conversation to start messaging a creator. After your next FanMeet, their chat will
              appear here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
