import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    event_id?: string;
    bid_id?: string;
    meet_id?: string;
}

export interface Message {
    id: string;
    sender_id: string;
    sender_username?: string;
    sender_display_name?: string;
    receiver_id: string;
    receiver_username?: string;
    receiver_display_name?: string;
    message: string;
    read: boolean;
    created_at: string;
    meet_id?: string;
    event_id?: string;
}

interface NotificationsContextValue {
    notifications: Notification[];
    messages: Message[];
    unreadNotificationsCount: number;
    unreadMessagesCount: number;
    isLoading: boolean;
    markNotificationAsRead: (notificationId: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;
    markMessageAsRead: (messageId: string) => Promise<void>;
    sendMessage: (receiverId: string, message: string, meetId?: string) => Promise<void>;
    refreshNotifications: () => Promise<void>;
    refreshMessages: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const unreadNotificationsCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications]
    );

    const unreadMessagesCount = useMemo(
        () => messages.filter((m) => !m.read && m.receiver_id === user?.id).length,
        [messages, user]
    );

    const fetchNotifications = async () => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching notifications:', error);
        } else {
            setNotifications(data || []);
        }
    };

    const fetchMessages = async () => {
        if (!user) {
            setMessages([]);
            return;
        }

        // Fetch messages where user is sender or receiver
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return;
        }

        if (data && data.length > 0) {
            // Fetch profiles for all senders and receivers
            const userIds = [
                ...new Set([
                    ...data.map((m) => m.sender_id),
                    ...data.map((m) => m.receiver_id),
                ]),
            ];

            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, username, display_name')
                .in('user_id', userIds);

            const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

            const messagesWithProfiles = data.map((m) => ({
                ...m,
                sender_username: profileMap.get(m.sender_id)?.username,
                sender_display_name: profileMap.get(m.sender_id)?.display_name,
                receiver_username: profileMap.get(m.receiver_id)?.username,
                receiver_display_name: profileMap.get(m.receiver_id)?.display_name,
            }));

            setMessages(messagesWithProfiles);
        } else {
            setMessages([]);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchNotifications(), fetchMessages()]);
            setIsLoading(false);
        };

        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const markNotificationAsRead: NotificationsContextValue['markNotificationAsRead'] = async (
        notificationId
    ) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
        } else {
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
            );
        }
    };

    const markAllNotificationsAsRead: NotificationsContextValue['markAllNotificationsAsRead'] =
        async () => {
            if (!user) return;

            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);

            if (error) {
                console.error('Error marking all notifications as read:', error);
            } else {
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            }
        };

    const markMessageAsRead: NotificationsContextValue['markMessageAsRead'] = async (messageId) => {
        const { error } = await supabase
            .from('messages')
            .update({ read: true })
            .eq('id', messageId);

        if (error) {
            console.error('Error marking message as read:', error);
        } else {
            setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, read: true } : m)));
        }
    };

    const sendMessage: NotificationsContextValue['sendMessage'] = async (
        receiverId,
        message,
        meetId
    ) => {
        if (!user) throw new Error('User not logged in');

        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: receiverId,
            message,
            meet_id: meetId || null,
        });

        if (error) {
            console.error('Error sending message:', error);
            throw error;
        }

        // Refresh messages
        await fetchMessages();
    };

    const refreshNotifications: NotificationsContextValue['refreshNotifications'] = async () => {
        await fetchNotifications();
    };

    const refreshMessages: NotificationsContextValue['refreshMessages'] = async () => {
        await fetchMessages();
    };

    const value = useMemo(
        () => ({
            notifications,
            messages,
            unreadNotificationsCount,
            unreadMessagesCount,
            isLoading,
            markNotificationAsRead,
            markAllNotificationsAsRead,
            markMessageAsRead,
            sendMessage,
            refreshNotifications,
            refreshMessages,
        }),
        [notifications, messages, unreadNotificationsCount, unreadMessagesCount, isLoading]
    );

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
    const context = useContext(NotificationsContext);

    if (!context) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }

    return context;
};
