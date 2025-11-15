import { useState } from 'react';
import { Card, CardContent, CardHeader, Button, Avatar } from '@fanmeet/ui';
import { MoreVertical, MoreHorizontal, Reply, Copy, Trash2, Flag, UserMinus2 } from 'lucide-react';
import { useDmPreferences } from '../../state/dmPreferences';

type StatusType = 'online' | 'dnd' | 'offline';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  status?: StatusType;
}

interface MessageItem {
  id: number;
  text: string;
  senderId: string;
  time: string;
}

const DEMO_FAN: Participant = {
  id: 'fan-123',
  name: 'You',
  avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=you',
};

const DEMO_CREATOR: Participant = {
  id: 'creator-456',
  name: 'Priya · Creator',
  avatar: 'https://api.dicebear.com/9.x/glass/svg?seed=creator',
  status: 'online',
};

const STATUS_COLORS: Record<StatusType, string> = {
  online: '#22c55e',
  dnd: '#ef4444',
  offline: '#9ca3af',
};

const DEMO_MESSAGES: MessageItem[] = [
  { id: 1, text: 'Hey Priya! Thanks for the amazing meet yesterday. 👋', senderId: DEMO_FAN.id, time: '09:00' },
  {
    id: 2,
    text: 'Hey! So happy you joined. How was the call for you?',
    senderId: DEMO_CREATOR.id,
    time: '09:01',
  },
  {
    id: 3,
    text: "It was incredible. I loved the part where you walked through your setup.",
    senderId: DEMO_FAN.id,
    time: '09:02',
  },
  {
    id: 4,
    text: 'Yay! Next time we can do a deeper dive on camera angles if you want.',
    senderId: DEMO_CREATOR.id,
    time: '09:04',
  },
  {
    id: 5,
    text: 'Would love that. I might bid again on your next event. 😊',
    senderId: DEMO_FAN.id,
    time: '09:06',
  },
  {
    id: 6,
    text: "Sounds good. I'll post the next FanMeet this weekend.",
    senderId: DEMO_CREATOR.id,
    time: '09:07',
  },
];

interface ConversationSummary {
  id: string;
  participant: Participant;
  lastMessage: string;
  lastTime: string;
  unread?: number;
}

const DEMO_CONVERSATIONS: ConversationSummary[] = [
  {
    id: 'conv-creator-priya',
    participant: DEMO_CREATOR,
    lastMessage: "I'll post the next FanMeet this weekend.",
    lastTime: '09:07',
    unread: 1,
  },
];

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
  const { creatorDmStatus } = useDmPreferences();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const isDmOpen = creatorDmStatus === 'open';
  const activeConversation =
    DEMO_CONVERSATIONS.find((conversation) => conversation.id === activeConversationId) ?? null;

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !isDmOpen || !activeConversation) return;
    setDraft('');
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col gap-4 md:flex-row">
      <div
        className={`flex w-full flex-col gap-3 md:w-80 ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[#212529]">Messages</h1>
          <p className="text-sm text-[#6C757D]">
            Chat with creators after your meets. If a creator keeps DMs open, you can send them follow-up
            questions here.
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
              {DEMO_CONVERSATIONS.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`mb-2 flex w-full items-center gap-3 rounded-[12px] border px-3 py-2 text-left text-sm transition-colors ${
                      isActive
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
                          {conversation.lastTime}
                        </span>
                      </div>
                      <span className="mt-0.5 line-clamp-1 text-[12px] text-[#6C757D]">
                        {conversation.lastMessage}
                      </span>
                    </div>
                    {conversation.unread ? (
                      <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C045FF] px-1 text-[11px] font-semibold text-white">
                        {conversation.unread}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {DEMO_CONVERSATIONS.length === 0 && (
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
        className={`flex h-full w-full flex-1 flex-col overflow-hidden ${
          activeConversation ? 'flex' : 'hidden md:flex'
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
                    {DEMO_CREATOR.status && <StatusBadge status={DEMO_CREATOR.status} />}
                    <span>{DEMO_CREATOR.status === 'online' ? 'Online now' : 'Last seen recently'}</span>
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
                {DEMO_MESSAGES.map((msg) => {
                  const isMe = msg.senderId === DEMO_FAN.id;

                  return (
                    <div
                      key={msg.id}
                      className={`group my-2 flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`flex max-w-[80%] items-start gap-2 ${
                          isMe ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <Avatar
                          src={isMe ? DEMO_FAN.avatar : activeConversation.participant.avatar}
                          alt={isMe ? DEMO_FAN.name : activeConversation.participant.name}
                          initials={isMe ? 'Y' : activeConversation.participant.name.charAt(0)}
                          size="sm"
                        />
                        <div>
                          <div
                            className={`rounded-2xl px-3 py-2 text-sm ${
                              isMe
                                ? 'bg-gradient-to-r from-[#C045FF] via-[#FF6B9D] to-[#8B3FFF] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]'
                                : 'border border-[#E9ECEF] bg-white text-[#212529]'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#6C757D]">
                            <time aria-label={`Sent at ${msg.time}`} dateTime={msg.time}>
                              {msg.time}
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
                {!isDmOpen && (
                  <p className="mb-2 text-xs font-medium text-[#E63946]">
                    This creator has turned off direct messages. You can no longer send new DMs.
                  </p>
                )}
                <form onSubmit={handleSend} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={
                      isDmOpen
                        ? 'Type your message to this creator...'
                        : 'DMs are closed for this creator'
                    }
                    disabled={!isDmOpen}
                    className="h-11 flex-1 rounded-[12px] border-2 border-[#E9ECEF] bg-white px-4 text-sm text-[#212529] placeholder:text-[#ADB5BD] focus:border-[#C045FF] focus:shadow-[0_0_0_3px_rgba(192,69,255,0.18)] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#F8F9FA]"
                  />
                  <Button
                    type="submit"
                    size="md"
                    disabled={!isDmOpen || !draft.trim()}
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
