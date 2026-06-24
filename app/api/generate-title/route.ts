import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ title: '新对话' });
    }

    // 提取对话的前几条消息内容用于生成标题
    const conversationContext = messages
      .slice(0, 6) // 取前3轮对话
      .map((msg: any) => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
      .join('\n');

    const prompt = `基于以下对话内容，生成一个简洁的对话标题，要求：
1. 不超过15个汉字
2. 概括对话的核心主题
3. 只返回标题文本，不要任何解释或标点符号

对话内容：
${conversationContext}

标题：`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 50
    });

    let title = completion.choices[0]?.message?.content?.trim() || '对话记录';

    // 清理标题：移除引号、句号等
    title = title.replace(/["""''。！？\.\!]/g, '').trim();

    // 限制长度
    if (title.length > 15) {
      title = title.substring(0, 15);
    }

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Generate title error:', error);
    return NextResponse.json({ title: '对话记录' });
  }
}
