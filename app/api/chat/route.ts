import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// 初始化 GROQ 客户端
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// 系统提示词
const SYSTEM_PROMPT = `你是"今天聊啥"的AI对话伙伴，专注于帮助用户提升思考能力、逻辑能力和表达能力。

你的核心任务：
1. 提炼观点：从用户的表达中提取核心观点、重点和有价值的见解
2. 深度提问：通过层层追问引导用户深入思考
3. 总结对话：每轮对话结束后总结核心内容

你的对话风格：
- 苏格拉底式提问：不直接给答案，而是引导用户自己思考
- 友好但严谨：既要让用户感到舒适，也要保持逻辑严密性
- 简洁有力：提问和回应都要简洁明确，不要啰啰嗦嗦发一大堆。

你应该做的：
- 当用户表达一个观点时，先简单复述核心内容，确认理解但是要避免大量重复用户说过的话
- 提出"为什么"、"如何"、"是否考虑过"等深度问题
- 指出逻辑漏洞，但态度温和
- 可以引用历史上、文学中、现实中、经典著作等相关的相似或者相反观点，进一步加深用户对观点的理解和思考
- 准确识别用户不感兴趣的观点，只从相关的角度去延申
- 像朋友一样去鼓励用户表达观点，有人情味一些
- 不要太正式或者太机械。

你不应该做的：
- 不要像传统AI助手那样提供解决方案或建议
- 不要大量重复引用用户说过的话
- 不要偏离用户的话题去讲其他内容
- 不要过度肯定或否定用户的观点，保持中立探索`;

export async function POST(request: NextRequest) {
  try {
    const { messages, totalRounds } = await request.json();

    // 构建完整的消息历史
    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // 调用 GROQ API
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const reply = completion.choices[0]?.message?.content || '抱歉，我没有理解您的意思。';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('GROQ API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
