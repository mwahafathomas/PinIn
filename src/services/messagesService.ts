import { ChatConversation, ChatMessage } from '../types/furniture';
import { supabase } from '../supabaseClient';
import { INITIAL_CONVERSATIONS } from '../data/mockData';

const LOCAL_CONVERSATIONS_KEY = 'pinin_chat_conversations_v1';

export interface SupabaseMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at?: string;
  is_read?: boolean;
}

export interface SupabaseConversationRow {
  id: string;
  item_id: string;
  item_title: string;
  item_image: string;
  item_price: number;
  seller_name: string;
  seller_avatar: string;
  buyer_id?: string;
  buyer_name?: string;
  buyer_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread: boolean;
  is_blocked?: boolean;
  created_at?: string;
  updated_at?: string;
}

const MOCK_CONV_IDS = new Set(['conv-1', 'conv-2']);

const isExcludedConversation = (name?: string, id?: string) => {
  if (id && MOCK_CONV_IDS.has(id)) return true;
  if (!name) return false;
  const lower = name.toLowerCase();
  return lower.includes('marcus') || lower.includes('gray');
};

// Local storage caching helpers
export function getLocalConversations(): ChatConversation[] {
  try {
    const raw = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c) =>
        !MOCK_CONV_IDS.has(c.id) &&
        !isExcludedConversation(c.sellerName, c.id) &&
        !isExcludedConversation(c.itemTitle)
    );
  } catch {
    return [];
  }
}

export function saveLocalConversations(conversations: ChatConversation[]) {
  try {
    const clean = conversations.filter(
      (c) =>
        !MOCK_CONV_IDS.has(c.id) &&
        !isExcludedConversation(c.sellerName, c.id) &&
        !isExcludedConversation(c.itemTitle)
    );
    localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(clean));
  } catch {}
}

// Helper for fast non-blocking fetch with timeout
async function withTimeout<T>(promise: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    const result = await Promise.race([Promise.resolve(promise), timeoutPromise]);
    if (timer) clearTimeout(timer);
    return result;
  } catch {
    if (timer) clearTimeout(timer);
    return fallback;
  }
}

// Fetch all conversations and their messages from Supabase
export async function fetchAllConversations(): Promise<ChatConversation[]> {
  try {
    // 1. Fetch conversations with timeout
    const convPromise = supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    const { data: convData, error: convError } = await withTimeout(convPromise, 7000, { data: null, error: null } as any);

    if (convError || !convData || !Array.isArray(convData)) {
      return getLocalConversations();
    }

    // 2. Fetch all messages with timeout
    const msgPromise = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    const { data: msgData } = await withTimeout(msgPromise, 7000, { data: null, error: null } as any);

    const messagesByConvId: { [convId: string]: ChatMessage[] } = {};
    if (msgData && Array.isArray(msgData)) {
      msgData.forEach((row: SupabaseMessageRow) => {
        if (!messagesByConvId[row.conversation_id]) {
          messagesByConvId[row.conversation_id] = [];
        }
        const timeStr = row.created_at
          ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '';

        messagesByConvId[row.conversation_id].push({
          id: row.id,
          senderId: row.sender_id,
          senderName: row.sender_name,
          text: row.text,
          timestamp: timeStr,
          date: 'Today',
          isMe: false, // Calculated per viewing user in UI
          isRead: row.is_read === true,
        });
      });
    }

    // 3. Map conversation rows to ChatConversation objects
    const parsedConversations: ChatConversation[] = (convData as SupabaseConversationRow[])
      .filter(
        (c) =>
          !MOCK_CONV_IDS.has(c.id) &&
          !isExcludedConversation(c.seller_name, c.id) &&
          !isExcludedConversation(c.buyer_name) &&
          !isExcludedConversation(c.item_title)
      )
      .map((c: SupabaseConversationRow) => {
        const msgs = messagesByConvId[c.id] || [];
        const sellerId = c.item_id?.startsWith('direct-')
          ? c.item_id.replace('direct-', '')
          : undefined;

        return {
          id: c.id,
          itemId: c.item_id,
          itemTitle: c.item_title,
          itemImage: c.item_image,
          itemPrice: Number(c.item_price) || 0,
          sellerName: c.seller_name,
          sellerAvatar: c.seller_avatar,
          sellerId: sellerId,
          buyerId: c.buyer_id,
          buyerName: c.buyer_name,
          buyerAvatar: c.buyer_avatar,
          lastMessage: c.last_message || (msgs.length > 0 ? msgs[msgs.length - 1].text : ''),
          lastMessageTime: c.last_message_time && c.last_message_time !== 'Just now' ? c.last_message_time : '',
          unread: c.unread ?? false,
          isBlocked: c.is_blocked ?? false,
          messages: msgs,
        };
      });

    saveLocalConversations(parsedConversations);
    return parsedConversations;
  } catch {
    return getLocalConversations();
  }
}

// Upsert conversation to Supabase
export async function saveConversationToDb(conv: ChatConversation, currentUserId?: string, currentUserName?: string, currentUserAvatar?: string) {
  try {
    const convRow: SupabaseConversationRow = {
      id: conv.id,
      item_id: conv.itemId,
      item_title: conv.itemTitle,
      item_image: conv.itemImage,
      item_price: conv.itemPrice,
      seller_name: conv.sellerName,
      seller_avatar: conv.sellerAvatar,
      buyer_id: conv.buyerId || currentUserId || 'buyer_local',
      buyer_name: conv.buyerName || currentUserName || 'Buyer',
      buyer_avatar: conv.buyerAvatar || currentUserAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      last_message: conv.lastMessage,
      last_message_time: conv.lastMessageTime,
      unread: conv.unread,
      is_blocked: conv.isBlocked || false,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('conversations').upsert([convRow]);
  } catch (e) {
    console.warn('Could not upsert conversation to Supabase:', e);
  }
}

// Send and persist a single message to Supabase
export async function saveMessageToDb(
  conversationId: string,
  message: ChatMessage
): Promise<boolean> {
  try {
    // 1. Insert message row with is_read defaulting to false
    const msgRow: SupabaseMessageRow = {
      id: message.id,
      conversation_id: conversationId,
      sender_id: message.senderId,
      sender_name: message.senderName,
      text: message.text,
      is_read: message.isRead === true,
    };

    await supabase.from('messages').insert([msgRow]);

    // 2. Update conversation's last message and mark as unread for the recipient
    await supabase
      .from('conversations')
      .update({
        last_message: message.text,
        last_message_time: message.timestamp,
        unread: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return true;
  } catch (err) {
    console.warn('Could not insert message to Supabase:', err);
    return false;
  }
}

// Mark all incoming messages in a conversation as read in Supabase
export async function markConversationMessagesAsReadInDb(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  try {
    if (!conversationId) return;

    // 1. Mark messages sent by the other party as read
    if (currentUserId) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId);
    } else {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId);
    }

    // 2. Mark conversation row as read
    await supabase
      .from('conversations')
      .update({ unread: false, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  } catch (err) {
    console.warn('Could not mark conversation as read in Supabase:', err);
  }
}

// Block / unblock conversation in Supabase
export async function setConversationBlockedInDb(conversationId: string, isBlocked: boolean) {
  try {
    await supabase
      .from('conversations')
      .update({ is_blocked: isBlocked, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  } catch {}
}

// Clear chat messages in Supabase
export async function clearConversationMessagesInDb(conversationId: string) {
  try {
    await supabase.from('messages').delete().eq('conversation_id', conversationId);
    await supabase
      .from('conversations')
      .update({ last_message: '', last_message_time: 'Just now', updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  } catch {}
}
