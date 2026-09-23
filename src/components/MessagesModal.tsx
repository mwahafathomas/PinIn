import React, { useState } from 'react';
import { X, Send, ArrowLeft, CheckCheck, MessageSquare } from 'lucide-react';
import { ChatConversation, FurnitureItem, UserAccount } from '../types/furniture';

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatConversation[];
  onSendMessage: (conversationId: string, text: string) => void;
  activeConversationId?: string | null;
  onSelectConversation: (id: string | null) => void;
  user: UserAccount;
}

export const MessagesModal: React.FC<MessagesModalProps> = ({
  isOpen,
  onClose,
  conversations,
  onSendMessage,
  activeConversationId,
  onSelectConversation,
  user,
}) => {
  const [replyText, setReplyText] = useState('');

  if (!isOpen) return null;

  const currentConv = conversations.find((c) => c.id === activeConversationId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConversationId) return;
    onSendMessage(activeConversationId, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md min-h-screen sm:min-h-[550px] sm:max-h-[85vh] sm:rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between">
          {currentConv ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectConversation(null)}
                aria-label="Back to conversations"
                className="p-1 -ml-1 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img
                src={currentConv.sellerAvatar}
                alt={currentConv.sellerName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="text-left">
                <p className="font-bold text-xs text-gray-900 leading-tight">
                  {currentConv.sellerName}
                </p>
                <p className="text-[11px] text-gray-500 truncate max-w-[170px]">
                  {currentConv.itemTitle}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#2D8EDE]" />
              <h2 className="font-extrabold text-base text-gray-900">PinIn Messages</h2>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {currentConv ? (
          /* Active Chat Thread */
          <div className="flex-1 flex flex-col justify-between bg-gray-50/50">
            {/* Item preview banner */}
            <div className="px-3 py-2 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <img
                  src={currentConv.itemImage}
                  alt={currentConv.itemTitle}
                  className="w-7 h-7 rounded object-cover"
                />
                <span className="font-semibold text-gray-800 truncate max-w-[190px]">
                  {currentConv.itemTitle}
                </span>
              </div>
              <span className="font-bold text-[#2D8EDE]">${currentConv.itemPrice}</span>
            </div>

            {/* Messages bubbles list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentConv.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs font-medium ${
                      msg.isMe
                        ? 'bg-[#2D8EDE] text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 text-xs px-3.5 py-2.5 bg-gray-100 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] focus:bg-white"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="p-2.5 bg-[#2D8EDE] text-white rounded-full disabled:opacity-40 hover:bg-[#2579BE] transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Conversations List */
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {conversations.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Message a seller from any furniture listing to start chatting.
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  type="button"
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className="w-full p-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="relative">
                    <img
                      src={conv.sellerAvatar}
                      alt={conv.sellerName}
                      className="w-11 h-11 rounded-full object-cover border border-gray-100"
                    />
                    <img
                      src={conv.itemImage}
                      alt="item"
                      className="w-4 h-4 rounded-full object-cover border-2 border-white absolute -bottom-1 -right-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs text-gray-900">{conv.sellerName}</span>
                      <span className="text-[10px] text-gray-400">{conv.lastMessageTime}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 truncate">{conv.itemTitle}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
