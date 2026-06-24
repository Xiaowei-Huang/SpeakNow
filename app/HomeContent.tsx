'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Message, Conversation } from '@/types';
import { generateId, calculateRounds } from '@/lib/utils';
import { saveConversation, getConversation } from '@/lib/db';
import ChatInterface from '@/components/ChatInterface';
import Link from 'next/link';

export default function HomeContent() {
  const searchParams = useSearchParams();
  const continueId = searchParams.get('continue');

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(true);

  // 初始化新对话
  const initNewConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      createdAt: new Date(),
      totalRounds: 0,
      messages: []
    };
    setConversation(newConversation);
    setShowSummary(false);
    setLoading(false);
  };

  // 加载历史对话
  const loadHistoryConversation = async (id: string) => {
    try {
      const historyConv = await getConversation(id);
      if (historyConv) {
        setConversation(historyConv);
        setShowSummary(false);
      } else {
        // 如果找不到对话,创建新的
        initNewConversation();
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      initNewConversation();
    } finally {
      setLoading(false);
    }
  };

  // 添加消息到对话
  const addMessage = useCallback((content: string, role: 'user' | 'assistant', audioUrl?: string) => {
    setConversation(prev => {
      if (!prev) return prev;

      const newMessage: Message = {
        id: generateId(),
        role,
        content,
        audioUrl,
        createdAt: new Date()
      };

      const updatedMessages = [...prev.messages, newMessage];
      const updatedConversation: Conversation = {
        ...prev,
        messages: updatedMessages,
        totalRounds: calculateRounds(updatedMessages)
      };

      // 异步保存(不阻塞状态更新)
      setTimeout(() => {
        // 如果是第三轮对话后的AI回复,自动生成标题
        if (role === 'assistant' && updatedConversation.totalRounds >= 3 && !updatedConversation.summary) {
          generateTitle(updatedConversation);
        } else {
          // 自动保存
          saveConversation(updatedConversation).catch(err =>
            console.error('Failed to save conversation:', err)
          );
        }
      }, 0);

      return updatedConversation;
    });
  }, []);

  // 生成对话标题
  const generateTitle = async (conv: Conversation) => {
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conv.messages })
      });

      if (response.ok) {
        const { title } = await response.json();
        const updatedConv = { ...conv, summary: title };
        setConversation(updatedConv);

        // 保存带标题的对话
        await saveConversation(updatedConv);
      }
    } catch (error) {
      console.error('Failed to generate title:', error);
      // 即使生成标题失败,也要保存对话
      saveConversation(conv).catch(err =>
        console.error('Failed to save conversation:', err)
      );
    }
  };

  // 结束对话并显示总结
  const endConversation = () => {
    setShowSummary(true);
  };

  // 继续聊天
  const continueChat = () => {
    setShowSummary(false);
  };

  // 开始新对话
  const startNewConversation = () => {
    initNewConversation();
  };

  // 初始化
  useEffect(() => {
    if (continueId) {
      // 如果有 continue 参数,加载历史对话
      loadHistoryConversation(continueId);
    } else {
      // 否则创建新对话
      initNewConversation();
    }
  }, [continueId]);

  if (!conversation || loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💭</div>
          <p className="text-gray-600">{loading ? '加载对话中...' : '正在初始化...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header - 使用自定义橙黄色 RGB(255, 153, 0) */}
      <div className="text-white py-4 md:py-6 shadow-xl border-b border-orange-400 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, rgb(255, 153, 0), rgb(255, 140, 0))' }}>
        {/* 装饰性光晕 */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl transform -translate-x-48 translate-y-48"></div>
        </div>

        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 relative z-10">
          {/* 继续对话提示 */}
          {continueId && conversation.messages.length > 0 && (
            <div className="mb-3 md:mb-4 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs sm:text-sm">🔄 继续之前的对话</span>
                {conversation.summary && (
                  <span className="text-xs sm:text-sm font-semibold line-clamp-1">「{conversation.summary}」</span>
                )}
              </div>
              <Link
                href="/"
                className="text-xs sm:text-sm px-3 py-1 bg-white/20 hover:bg-white/30 rounded transition-all whitespace-nowrap self-start sm:self-auto"
              >
                开始新对话
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* 标题部分 */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                今天聊啥 💭
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-orange-50">
                锻炼思考 · 沉淀观点 · 提升表达
              </p>
            </div>

            {/* 右侧信息栏 */}
            <div className="flex items-center gap-2 sm:gap-3">
              {conversation.messages.length > 0 && (
                <div className="text-right">
                  <div className="text-xs sm:text-sm text-orange-50">对话轮数</div>
                  <div className="text-2xl sm:text-3xl font-bold">{conversation.totalRounds}</div>
                </div>
              )}

              <Link
                href="/history"
                className="px-3 py-2 sm:px-4 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-white text-xs sm:text-sm whitespace-nowrap"
              >
                📚 查看历史对话
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8">
        <ChatInterface
          conversation={conversation}
          onAddMessage={addMessage}
          onEndConversation={endConversation}
        />
      </div>
    </div>
  );
}
