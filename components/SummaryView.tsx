'use client';

import { useState, useEffect } from 'react';
import { Conversation, ConversationSummary } from '@/types';

interface SummaryViewProps {
  conversation: Conversation;
}

export default function SummaryView({ conversation }: SummaryViewProps) {
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateSummary();
  }, []);

  const generateSummary = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation })
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      // 生成一个基础的总结
      setSummary({
        coreInsights: ['对话总结生成失败'],
        thinkingProcess: '无法生成思维脉络',
        clarityScore: 0,
        logicScore: 0,
        depthScore: 0,
        improvementTips: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-amber-50 rounded-2xl border-2 border-amber-300 p-6 text-center">
        <div className="text-4xl mb-3 animate-pulse">✨</div>
        <p className="text-gray-700 font-medium">正在生成总结...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 p-6 shadow-lg">
      {/* Header */}
      <div className="border-b border-amber-300 pb-4 mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">✨</span>
          对话总结
        </h3>
      </div>

      {/* 核心观点 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          核心观点
        </h4>
        <ul className="space-y-2">
          {summary?.coreInsights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <span className="text-amber-600 font-semibold mr-2">{index + 1}.</span>
              <span className="text-gray-700">{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 思维脉络 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">🧠</span>
          思考脉络
        </h4>
        <p className="text-gray-700 leading-relaxed bg-white/60 p-4 rounded-lg border border-amber-200">
          {summary?.thinkingProcess}
        </p>
      </div>

      {/* 表达能力评价 - 显示星级和具体例子 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">⭐</span>
          表达亮点
        </h4>
        <div className="space-y-4 bg-white/60 p-4 rounded-lg border border-amber-200">
          {/* 清晰度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">清晰度</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-xl">
                    {(summary?.clarityScore || 0) >= star ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
            </div>
            {summary?.clarityExample && (
              <p className="text-sm text-gray-600 bg-amber-50 p-2 rounded border-l-2 border-amber-400">
                {summary.clarityExample}
              </p>
            )}
          </div>

          {/* 逻辑连贯性 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">逻辑性</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-xl">
                    {(summary?.logicScore || 0) >= star ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
            </div>
            {summary?.logicExample && (
              <p className="text-sm text-gray-600 bg-amber-50 p-2 rounded border-l-2 border-amber-400">
                {summary.logicExample}
              </p>
            )}
          </div>

          {/* 深度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">思考深度</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-xl">
                    {(summary?.depthScore || 0) >= star ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
            </div>
            {summary?.depthExample && (
              <p className="text-sm text-gray-600 bg-amber-50 p-2 rounded border-l-2 border-amber-400">
                {summary.depthExample}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 建议 - 融合了改进建议和逻辑漏洞 */}
      {summary?.improvementTips && summary.improvementTips.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">💭</span>
            继续探索
          </h4>
          <ul className="space-y-2 bg-white/60 p-4 rounded-lg border border-amber-200">
            {summary.improvementTips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-orange-500 mr-2">✦</span>
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
