'use client';

import { useState, useRef, useEffect } from 'react';
import { Conversation } from '@/types';
import MessageBubble from './MessageBubble';
import VoiceRecorder from './VoiceRecorder';
import SummaryView from './SummaryView';

interface ChatInterfaceProps {
  conversation: Conversation;
  onAddMessage: (content: string, role: 'user' | 'assistant', audioUrl?: string) => void;
  onEndConversation: () => void;
}

export default function ChatInterface({ conversation, onAddMessage, onEndConversation }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages, showSummary]);

  // 发送消息
  const handleSendMessage = async (content: string, audioUrl?: string) => {
    if (!content.trim() || isLoading) return;

    setInput('');
    setIsLoading(true);

    // 先构建完整的消息历史（包括即将发送的用户消息）
    const userMessage = { role: 'user' as const, content };
    const messagesWithNewUser = [...conversation.messages, userMessage];

    // 添加用户消息到界面
    onAddMessage(content, 'user', audioUrl);

    try {
      // 调用 AI API，使用包含新用户消息的完整历史
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesWithNewUser,
          totalRounds: conversation.totalRounds
        })
      });

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      const data = await response.json();
      onAddMessage(data.reply, 'assistant');
    } catch (error) {
      console.error('Failed to get AI response:', error);
      onAddMessage('抱歉,我遇到了一些问题。请稍后再试。', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  // 文字输入发送
  const handleTextSend = () => {
    handleSendMessage(input);
  };

  // 语音识别更新输入框
  const handleTranscriptUpdate = (transcript: string) => {
    // 保留输入框中原有的文字，只添加新的语音识别文字
    // 注意：这里不需要特殊处理，因为录音时会累积所有文字
    setInput(transcript);
  };

  // 录音状态改变
  const handleRecordingStateChange = (recording: boolean) => {
    setIsRecording(recording);
    // 如果开始录音，记录当前输入框的文字
    if (recording) {
      // VoiceRecorder 组件会处理文字追加
    }
  };

  // 生成总结
  const handleGenerateSummary = () => {
    setShowSummary(true);
  };

  // 显示总结按钮的条件
  const showSummaryButton = conversation.totalRounds >= 3 && !showSummary;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {conversation.messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💭</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              今天想聊什么?
            </h2>
            <p className="text-gray-600">
              点击下方麦克风按钮开始语音输入,或使用文字输入
            </p>
          </div>
        )}

        {/* 显示所有消息 */}
        {conversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500 pl-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm">AI 正在思考...</span>
          </div>
        )}

        {/* 显示总结（如果用户点击了生成总结按钮） */}
        {showSummary && (
          <div className="mt-6">
            <SummaryView conversation={conversation} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 总结按钮 */}
      {showSummaryButton && !isLoading && (
        <div className="mb-4 text-center">
          <button
            onClick={handleGenerateSummary}
            className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-full hover:from-amber-700 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
          >
            📝 生成对话总结
          </button>
        </div>
      )}

      {/* 输入区域 */}
      <div className="bg-white rounded-2xl shadow-xl p-4 border border-amber-200">
        <div className="flex items-center space-x-3">
          {/* 语音录制按钮 */}
          <VoiceRecorder
            onTranscriptUpdate={handleTranscriptUpdate}
            onRecordingStateChange={handleRecordingStateChange}
            currentInput={input}
            disabled={isLoading}
          />

          {/* 文字输入 */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isRecording && handleTextSend()}
            placeholder={isRecording ? "正在录音..." : "或者在这里输入文字..."}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
          />

          {/* 发送按钮 */}
          <button
            onClick={handleTextSend}
            disabled={!input.trim() || isLoading || isRecording}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-xl hover:from-amber-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
