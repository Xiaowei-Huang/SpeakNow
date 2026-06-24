'use client';

import { useState, useEffect } from 'react';
import { getAllConversations, deleteConversation } from '@/lib/db';
import { Conversation } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await getAllConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // 阻止Link跳转
    e.stopPropagation();

    if (!confirm('确定要删除这条对话记录吗？')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('删除失败，请重试');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📚</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 via-yellow-600 to-orange-500 text-white py-6 shadow-xl border-b border-amber-400 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-300 rounded-full blur-3xl transform -translate-x-48 translate-y-48"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                📚 历史对话
              </h1>
              <p className="text-sm sm:text-base text-orange-50">
                回顾你的思考轨迹
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              还没有对话记录
            </h2>
            <p className="text-gray-600 mb-6">
              开始你的第一次对话吧！
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-xl hover:from-amber-700 hover:to-orange-600 transition-all"
            >
              返回首页
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-amber-200 hover:border-amber-400 group relative"
              >
                {/* 可点击区域 */}
                <Link
                  href={`/history/${conv.id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      {/* 对话标题 */}
                      <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-amber-700 transition-colors">
                        {conv.summary || '未命名对话'}
                      </h3>

                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                        <span>📅 {formatDate(conv.createdAt)}</span>
                        <span>•</span>
                        <span>{formatTime(conv.createdAt)}</span>
                        <span>•</span>
                        <span className="font-semibold text-amber-700">{conv.totalRounds} 轮对话</span>
                        <span>•</span>
                        <span>{conv.messages.length} 条消息</span>
                      </div>

                      {/* 显示前两条消息预览 */}
                      <div className="space-y-2">
                        {conv.messages.slice(0, 2).map((msg, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              msg.role === 'user'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {msg.role === 'user' ? '你' : 'AI'}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1 flex-1">
                              {msg.content}
                            </p>
                          </div>
                        ))}
                        {conv.messages.length > 2 && (
                          <p className="text-sm text-gray-400 pl-8">
                            ... 还有 {conv.messages.length - 2} 条消息
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 评分展示 */}
                    {(conv.clarityScore || conv.logicScore || conv.depthScore) && (
                      <div className="ml-6 flex flex-col items-end space-y-1">
                        {conv.clarityScore !== undefined && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">清晰</span>
                            <span className="text-sm">
                              {'⭐'.repeat(conv.clarityScore)}
                            </span>
                          </div>
                        )}
                        {conv.logicScore !== undefined && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">逻辑</span>
                            <span className="text-sm">
                              {'⭐'.repeat(conv.logicScore)}
                            </span>
                          </div>
                        )}
                        {conv.depthScore !== undefined && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">深度</span>
                            <span className="text-sm">
                              {'⭐'.repeat(conv.depthScore)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Link>

                {/* 底部操作栏 */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    点击查看完整对话
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/?continue=${conv.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors z-10"
                    >
                      🔄 继续对话
                    </Link>
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      disabled={deletingId === conv.id}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 z-10"
                    >
                      {deletingId === conv.id ? '删除中...' : '🗑️ 删除'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
