import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  MoreVertical,
  Send,
  CheckCheck,
  ShieldAlert,
  Ban,
  Trash2,
  Unlock,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Users,
} from 'lucide-react';
import { ChatConversation, ChatMessage, UserAccount } from '../types/furniture';
import { DEFAULT_AVATAR_IMAGE } from '../data/defaultAvatar';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatDisplayName } from '../utils/formatUtils';
import { fetchUserProfilePicture } from '../services/profilesService';

interface AppUserOption {
  id: string;
  name: string;
  avatar: string;
  location?: string;
  role?: string;
}

interface ChatBoxPageProps {
  conversation: ChatConversation | null;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (conversationId: string, text: string) => void;
  onBlockUser?: (conversationId: string) => void;
  onUnblockUser?: (conversationId: string) => void;
  onClearChat?: (conversationId: string) => void;
  onMarkAsRead?: (conversationId: string) => void;
  onOpenUserProfile?: (userId: string, initialData?: { id?: string; name?: string; surname?: string; avatar?: string; location?: string; bio?: string }) => void;
  unreadMessagesCount?: number;
  user: UserAccount;
  allUsers?: AppUserOption[];
}

// Scam & Payment Risk Trigger Terms
const SUSPICIOUS_KEYWORDS = [
  'deposit',
  'delivery fee',
  'eft',
  'pay now',
  'send a link',
  'send link',
  'payment link',
  'bank transfer',
  'cash upfront',
  'wire transfer',
  'pay upfront',
  'courier fee',
  'shipping fee',
];

export const ChatBoxPage: React.FC<ChatBoxPageProps> = ({
  conversation,
  isOpen,
  onClose,
  onSendMessage,
  onBlockUser,
  onUnblockUser,
  onClearChat,
  onMarkAsRead,
  onOpenUserProfile,
  unreadMessagesCount = 0,
  user,
  allUsers = [],
}) => {
  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [partnerProfilePic, setPartnerProfilePic] = useState<string | null>(null);
  
  // Keyword Warning Popup State
  const [isKeywordWarningOpen, setIsKeywordWarningOpen] = useState(false);
  const [matchedKeyword, setMatchedKeyword] = useState('');
  const [pendingTextToSend, setPendingTextToSend] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch partner profile picture from Supabase profiles
  useEffect(() => {
    if (!conversation) return;
    const isCurrentUserSeller =
      (conversation.sellerId && conversation.sellerId === user.id) ||
      (user.name && conversation.sellerName && conversation.sellerName.trim().toLowerCase() === user.name.trim().toLowerCase());
    const otherId = isCurrentUserSeller ? conversation.buyerId : conversation.sellerId;
    if (otherId) {
      fetchUserProfilePicture(otherId).then((pic) => {
        if (pic) setPartnerProfilePic(pic);
      });
    }
  }, [conversation?.id, conversation?.buyerId, conversation?.sellerId, user.id, user.name]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, conversation?.messages]);

  // Mark incoming messages as read when opening or viewing the chat
  useEffect(() => {
    if (isOpen && conversation && onMarkAsRead) {
      const hasUnreadFromOther = conversation.messages.some(
        (m) => m.senderId !== user.id && m.isRead === false
      );
      if (hasUnreadFromOther || conversation.unread) {
        onMarkAsRead(conversation.id);
      }
    }
  }, [isOpen, conversation?.id, conversation?.messages, onMarkAsRead, user.id]);

  const groupedMessages = useMemo(() => {
    if (!conversation) return [];

    const groups: { dateLabel: string; messages: ChatMessage[] }[] = [];
    let currentGroup: { dateLabel: string; messages: ChatMessage[] } | null = null;

    conversation.messages.forEach((msg) => {
      const msgDate = msg.date || 'Today';
      if (!currentGroup || currentGroup.dateLabel !== msgDate) {
        currentGroup = {
          dateLabel: msgDate,
          messages: [msg],
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(msg);
      }
    });

    return groups;
  }, [conversation?.messages]);

  const otherParty = useMemo(() => {
    const isCurrentUserSeller =
      (conversation.sellerId && conversation.sellerId === user.id) ||
      (user.name && conversation.sellerName && conversation.sellerName.trim().toLowerCase() === user.name.trim().toLowerCase());

    const otherId = isCurrentUserSeller ? conversation.buyerId : conversation.sellerId;
    const rawName = (isCurrentUserSeller && conversation.buyerName)
      ? conversation.buyerName
      : (conversation.sellerName || 'User');

    let avatar = partnerProfilePic || ((isCurrentUserSeller && conversation.buyerAvatar)
      ? conversation.buyerAvatar
      : (conversation.sellerAvatar || ''));

    let userLocation: string | undefined;

    // Check allUsers for an uploaded profile picture or location if partnerProfilePic not available
    const matchingUser = allUsers.find(
      (u) =>
        (otherId && u.id === otherId) ||
        (u.name && rawName && u.name.trim().toLowerCase() === rawName.trim().toLowerCase())
    );

    if (matchingUser) {
      userLocation = matchingUser.location;
      if (!partnerProfilePic && matchingUser.avatar && matchingUser.avatar.trim() !== '') {
        avatar = matchingUser.avatar;
      }
    }

    if (!avatar || avatar.trim() === '') {
      avatar = DEFAULT_AVATAR_IMAGE;
    }

    return {
      id: otherId || matchingUser?.id || '',
      name: formatDisplayName(rawName),
      avatar,
      location: userLocation,
    };
  }, [conversation, user, allUsers, partnerProfilePic]);

  if (!isOpen || !conversation) return null;

  // Check if a message contains suspicious payment trigger keywords
  const checkMessageForKeywords = (text: string): string | null => {
    const lower = text.toLowerCase();
    for (const kw of SUSPICIOUS_KEYWORDS) {
      if (lower.includes(kw)) {
        return kw;
      }
    }
    return null;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || conversation.isBlocked) return;

    const trimmed = inputText.trim();
    const flaggedKeyword = checkMessageForKeywords(trimmed);

    if (flaggedKeyword) {
      setMatchedKeyword(flaggedKeyword);
      setPendingTextToSend(trimmed);
      setIsKeywordWarningOpen(true);
      return;
    }

    sendMessageDirectly(trimmed);
  };

  const sendMessageDirectly = (text: string) => {
    onSendMessage(conversation.id, text);
    setInputText('');
    setPendingTextToSend('');
    setIsKeywordWarningOpen(false);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleConfirmSendFlagged = () => {
    if (pendingTextToSend) {
      sendMessageDirectly(pendingTextToSend);
    }
  };

  const handleConfirmBlock = () => {
    if (onBlockUser) {
      onBlockUser(conversation.id);
    }
    setIsBlockConfirmOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none"
      onClick={() => setIsMenuOpen(false)}
    >
      {/* Top Header Bar (White) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) and Messages icon with unread count */}
          <div className="flex items-center gap-0.5 sm:gap-1 -ml-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back to messages"
              className="p-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#0052FF]">In</span>
            </span>
          </div>

          {/* 3 dots */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              aria-label="Chat options"
              className="p-2 -mr-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] cursor-pointer"
            >
              <MoreVertical className="w-5 h-5 stroke-[2.5] text-gray-700 hover:text-[#0052FF]" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3.5 py-1.5 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Chat Options
                  </p>
                </div>

                {conversation.isBlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onUnblockUser) onUnblockUser(conversation.id);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Unlock className="w-4 h-4 text-emerald-600" />
                    <span>Unblock User</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsBlockConfirmOpen(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Ban className="w-4 h-4 text-red-500" />
                    <span>Block User</span>
                  </button>
                )}

                {onClearChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onClearChat(conversation.id);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                    <span>Clear Messages</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Chat Scrollable Container */}
      <main className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto flex flex-col min-h-0 bg-white overflow-hidden md:border-x md:border-gray-200">
        {/* Safety Header Banner: "Meet in public place & encourage buyers to go with someone" */}
        <div className="bg-blue-50/90 border-b border-blue-100 px-3.5 md:px-6 py-2 flex items-center gap-2 text-blue-900 shrink-0">
          <div className="w-5 h-5 rounded-full bg-[#0052FF] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-3 h-3" />
          </div>
          <p className="text-[11px] font-bold leading-tight flex-1">
            Meet in a public place &amp; we strongly encourage buyers to go with someone.
          </p>
        </div>

        {/* Hero User Header */}
        <div className="pt-3 pb-2.5 px-4 md:px-6 flex flex-col items-center text-center border-b border-gray-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => {
              if (onOpenUserProfile) {
                onOpenUserProfile(otherParty.id, {
                  id: otherParty.id,
                  name: otherParty.name,
                  avatar: otherParty.avatar,
                  location: otherParty.location,
                });
              }
            }}
            className="flex flex-col items-center group cursor-pointer focus-visible:outline-none"
            aria-label={`View ${otherParty.name}'s profile`}
          >
            <div className="relative mb-1.5 transition-transform group-hover:scale-105 active:scale-95">
              <img
                src={getOptimizedImageUrl(otherParty.avatar || DEFAULT_AVATAR_IMAGE, { width: 150, quality: 75, format: 'webp' })}
                alt={otherParty.name}
                className="w-14 h-14 rounded-full object-cover border border-gray-200 shadow-sm group-hover:border-[#0052FF] transition-colors"
                loading="lazy"
                decoding="async"
              />
            </div>

            <h2 className="text-base font-black text-gray-900 tracking-tight group-hover:text-[#0052FF] transition-colors">
              {otherParty.name}
            </h2>
          </button>

          {conversation.itemTitle && !conversation.itemTitle.startsWith('Chat with ') && conversation.itemPrice > 0 && (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span className="truncate max-w-[240px] md:max-w-md">
                {conversation.itemTitle}
              </span>
              <span className="text-[#0052FF] font-black">
                · R{conversation.itemPrice}
              </span>
            </div>
          )}

          {conversation.isBlocked && (
            <div className="mt-2 px-3 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-[11px] font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>You have blocked this user</span>
            </div>
          )}
        </div>

        {/* Message Thread History Area */}
        <div className="flex-1 p-4 md:p-6 space-y-4 bg-gray-50/60 overflow-y-auto">
          {groupedMessages.length === 0 && (
            <div className="py-10 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0052FF] flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 stroke-[2]" />
              </div>
              <p className="text-xs font-bold text-gray-800">
                Start a conversation with {otherParty.name}
              </p>
            </div>
          )}

          {groupedMessages.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <div className="flex items-center justify-center my-3">
                <span className="px-3 py-1 rounded-full bg-gray-200/80 text-gray-700 text-[10px] font-extrabold tracking-wider uppercase shadow-2xs">
                  {group.dateLabel}
                </span>
              </div>

              {group.messages.map((msg) => {
                const flaggedTerm = checkMessageForKeywords(msg.text);
                const isMe =
                  msg.senderId === user.id ||
                  msg.senderId === 'me' ||
                  (user.name && msg.senderName && msg.senderName.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
                  (msg.isMe && (!msg.senderId || msg.senderId === user.id || msg.senderId === 'me'));

                if (isMe) {
                  const isRead = msg.isRead ?? true;

                  return (
                    <div
                      key={msg.id}
                      className="flex flex-col items-end group/msg"
                    >
                      <div className="max-w-[80%] bg-[#0052FF] text-white px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs text-xs font-medium leading-relaxed break-words">
                        {msg.text}
                      </div>

                      {/* Security Warning Badge under flagged keyword message */}
                      {flaggedTerm && (
                        <div className="mt-1 max-w-[80%] bg-amber-50 border border-amber-200 rounded-xl p-2 text-[10px] text-amber-900 font-bold flex items-center gap-1.5 shadow-2xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Security Note: Never send deposits or EFTs in advance. Inspect item first.
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 mt-1 pr-1">
                        <span className="text-[10px] text-gray-400 font-medium">
                          {msg.timestamp}
                        </span>

                        <CheckCheck
                          className={`w-3.5 h-3.5 ${
                            isRead ? 'text-[#0052FF]' : 'text-gray-400'
                          }`}
                          aria-label={isRead ? 'Read' : 'Sent'}
                        />
                      </div>
                    </div>
                  );
                } else {
                  const isRead = msg.isRead ?? true;

                  return (
                    <div
                      key={msg.id}
                      className="flex items-start gap-2 max-w-[88%] group/msg"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenUserProfile) {
                            onOpenUserProfile(otherParty.id, {
                              id: otherParty.id,
                              name: otherParty.name,
                              avatar: otherParty.avatar,
                              location: otherParty.location,
                            });
                          }
                        }}
                        className="shrink-0 cursor-pointer active:scale-95 transition-transform focus-visible:outline-none"
                        aria-label={`View ${otherParty.name}'s profile`}
                      >
                        <img
                          src={getOptimizedImageUrl(otherParty.avatar || DEFAULT_AVATAR_IMAGE, { width: 100, quality: 75, format: 'webp' })}
                          alt={otherParty.name}
                          className="w-7 h-7 rounded-full object-cover mt-0.5 border border-gray-200 shadow-2xs hover:border-[#0052FF]"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>

                      <div className="flex flex-col items-start min-w-0">
                        <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-xs shadow-xs text-xs font-medium leading-relaxed break-words">
                          {msg.text}
                        </div>

                        {/* Security Warning Badge under flagged keyword message */}
                        {flaggedTerm && (
                          <div className="mt-1 bg-amber-50 border border-amber-200 rounded-xl p-2 text-[10px] text-amber-900 font-bold flex items-center gap-1.5 shadow-2xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              Security Alert: Do not pay deposits, delivery fees, or click links.
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 mt-1 pl-1">
                          <span className="text-[10px] text-gray-400 font-medium">
                            {msg.timestamp}
                          </span>

                          <CheckCheck
                            className={`w-3.5 h-3.5 ${
                              isRead ? 'text-[#0052FF]' : 'text-gray-400'
                            }`}
                            aria-label={isRead ? 'Read by user' : 'Delivered'}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Bar */}
      <footer className="shrink-0 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto bg-white border-t border-gray-200 p-3 md:px-6 z-30 pb-safe">
        {conversation.isBlocked ? (
          <div className="py-2.5 px-4 bg-gray-100 rounded-2xl text-center text-xs font-bold text-gray-500 flex items-center justify-center gap-2">
            <Ban className="w-4 h-4 text-red-500" />
            <span>You cannot send messages to a blocked user.</span>
          </div>
        ) : (
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 bg-gray-50 rounded-full border-2 border-gray-200 p-1.5 focus-within:border-[#0052FF] focus-within:bg-white transition-all shadow-xs"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${otherParty.name}...`}
              aria-label="Type message"
              className="flex-1 bg-transparent px-3.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 font-semibold outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 rounded-full bg-[#0052FF] hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center active:scale-95 transition-all shrink-0 shadow-xs cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 -translate-x-px" />
            </button>
          </form>
        )}
      </footer>

      {/* Keyword Auto Warning Modal Trigger */}
      {isKeywordWarningOpen && (
        <div
          className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsKeywordWarningOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border-2 border-amber-300 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Security Warning
                </span>
                <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight">
                  High-Risk Payment Term Detected
                </h3>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-xs text-gray-800 leading-relaxed font-medium space-y-1.5">
              <p>
                Your message mentions <strong>"{matchedKeyword}"</strong>.
              </p>
              <p className="text-gray-700">
                PinIn strongly cautions all buyers and sellers: <strong>Never send deposits, upfront delivery fees, EFTs, or click payment links</strong> before inspecting furniture in person.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsKeywordWarningOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Edit Message
              </button>
              <button
                type="button"
                onClick={handleConfirmSendFlagged}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition-colors"
              >
                Send Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Confirmation Dialog */}
      {isBlockConfirmOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsBlockConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-200 text-center space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-gray-900">
                Block {conversation.sellerName}?
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Blocked users cannot send you messages or view your active listings on PinIn.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBlockConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
