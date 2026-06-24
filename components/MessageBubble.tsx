'use client';

import { Message } from '@/types';
import { formatTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* 消息气泡 */}
        <div
          className={`px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-md ${
            isUser
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-tr-none'
              : 'bg-white text-gray-800 rounded-tl-none border border-amber-200'
          }`}
        >
          <p className="text-sm md:text-base whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* 时间戳 */}
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.createdAt)}
        </div>

        {/* 语音标记 */}
        {message.audioUrl && (
          <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            🎤 语音输入
          </div>
        )}
      </div>
    </div>
  );
}
