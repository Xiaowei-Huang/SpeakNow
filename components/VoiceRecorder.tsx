'use client';

import { useState, useRef } from 'react';

interface VoiceRecorderProps {
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingStateChange: (isRecording: boolean) => void;
  currentInput?: string; // 当前输入框中的文字
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscriptUpdate, onRecordingStateChange, currentInput = '', disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef<string>('');
  const isStoppingRef = useRef(false);
  const startingInputRef = useRef<string>(''); // 记录开始录音时的输入框文字

  // 开始录音
  const startRecording = () => {
    console.log('Starting recording...');
    setError(null);
    fullTranscriptRef.current = '';
    isStoppingRef.current = false;
    startingInputRef.current = currentInput; // 保存开始录音时的文字

    // 检查浏览器支持
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('您的浏览器不支持语音识别');
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log('Recording started');
      setIsRecording(true);
      onRecordingStateChange(true);
    };

    recognition.onresult = (event: any) => {
      if (isStoppingRef.current) return; // 如果正在停止，忽略新结果

      let finalTranscript = '';
      let interimTranscript = '';

      // 只处理从 event.resultIndex 开始的新结果，避免重复
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece;
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      // 累积最终识别的文字
      if (finalTranscript) {
        fullTranscriptRef.current += finalTranscript;
        console.log('Final transcript added:', finalTranscript);
      }

      // 拼接：原有文字 + 已确认的语音文字 + 临时文字
      const currentText = startingInputRef.current + fullTranscriptRef.current + interimTranscript;
      console.log('Current text:', currentText);
      onTranscriptUpdate(currentText);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      // 忽略 "no-speech" 和 "aborted" 错误（这些是正常的停止）
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError('语音识别失败: ' + event.error);
      }

      setIsRecording(false);
      onRecordingStateChange(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      console.log('Recognition ended, isStoppingRef:', isStoppingRef.current);

      setIsRecording(false);
      onRecordingStateChange(false);

      // 清理引用和状态
      recognitionRef.current = null;
      isStoppingRef.current = false; // 重置停止标志
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      console.log('Recognition start called');
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setError('启动录音失败');
    }
  };

  // 停止录音
  const stopRecording = () => {
    console.log('Stopping recording...');
    isStoppingRef.current = true;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('Recognition.stop() called');
      } catch (error) {
        console.error('Failed to stop recognition:', error);
        // 即使停止失败，也要重置状态
        setIsRecording(false);
        onRecordingStateChange(false);
        recognitionRef.current = null;
        isStoppingRef.current = false;
      }
    }
  };

  // 点击按钮切换录音状态
  const handleClick = () => {
    console.log('Button clicked, isRecording:', isRecording, 'recognitionRef:', !!recognitionRef.current);

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? 'bg-red-500 scale-110 animate-pulse'
            : 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600'
        } text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isRecording ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
            <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 0 1 2 0z"/>
            <path d="M13 19.938V21h3a1 1 0 0 1 0 2H8a1 1 0 0 1 0-2h3v-1.062A8.001 8.001 0 0 1 4 12v-1a1 1 0 0 1 2 0v1a6 6 0 1 0 12 0v-1a1 1 0 0 1 2 0v1a8.001 8.001 0 0 1-7 7.938z"/>
          </svg>
        )}
      </button>

      {isRecording && (
        <p className="text-xs text-red-500 mt-2 animate-pulse">正在录音...</p>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
