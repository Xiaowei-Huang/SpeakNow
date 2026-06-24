'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getConversation, deleteConversation } from '@/lib/db';
import { Conversation } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';
import MessageBubble from '@/components/MessageBubble';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadConversation();
  }, [id]);

  const loadConversation = async () => {
    try {
      const data = await getConversation(id);
      setConversation(data);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这条对话记录吗？删除后将返回历史对话页面。')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteConversation(id);
      router.push('/history');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('删除失败，请重试');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">💭</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            未找到对话记录
          </h2>
          <p className="text-gray-600 mb-6">
            该对话可能已被删除或不存在
          </p>
          <Link
            href="/history"
            className="inline-block px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-xl hover:from-amber-700 hover:to-orange-600 transition-all"
          >
            返回历史对话
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="text-white py-6 shadow-xl border-b border-orange-400 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, rgb(255, 153, 0), rgb(255, 140, 0))' }}>
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl transform -translate-x-48 translate-y-48"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                💭 对话详情
              </h1>
              <div className="flex items-center space-x-3 text-sm text-orange-50">
                <span>📅 {formatDate(conversation.createdAt)}</span>
                <span>•</span>
                <span>{formatTime(conversation.createdAt)}</span>
                <span>•</span>
                <span>{conversation.totalRounds} 轮对话</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href={`/?continue=${id}`}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all"
              >
                🔄 继续对话
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg transition-all disabled:opacity-50"
              >
                {deleting ? '删除中...' : '🗑️ 删除'}
              </button>
              <Link
                href="/history"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
              >
                返回历史对话
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* 对话总结卡片 */}
        {conversation.summary && (
          <div className="bg-white rounded-xl p-6 shadow-md mb-6 border border-amber-200">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">📝</span>
              对话总结
            </h2>
            <p className="text-gray-700 leading-relaxed">{conversation.summary}</p>

            {/* 评分展示 */}
            {(conversation.clarityScore || conversation.logicScore || conversation.depthScore) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4">
                  {conversation.clarityScore !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl mb-1">
                        {'⭐'.repeat(conversation.clarityScore)}
                        {'☆'.repeat(5 - conversation.clarityScore)}
                      </div>
                      <div className="text-sm text-gray-600">清晰度</div>
                    </div>
                  )}
                  {conversation.logicScore !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl mb-1">
                        {'⭐'.repeat(conversation.logicScore)}
                        {'☆'.repeat(5 - conversation.logicScore)}
                      </div>
                      <div className="text-sm text-gray-600">逻辑性</div>
                    </div>
                  )}
                  {conversation.depthScore !== undefined && (
                    <div className="text-center">
                      <div className="text-2xl mb-1">
                        {'⭐'.repeat(conversation.depthScore)}
                        {'☆'.repeat(5 - conversation.depthScore)}
                      </div>
                      <div className="text-sm text-gray-600">深度</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 改进建议 */}
            {conversation.improvementTips && conversation.improvementTips.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">💡 改进建议</h3>
                <ul className="space-y-1">
                  {conversation.improvementTips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 对话内容 */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-amber-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">💬</span>
            完整对话
          </h2>
          <div className="space-y-4">
            {conversation.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
