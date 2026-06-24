import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SUMMARY_PROMPT = `请根据以下对话内容，生成一份深度分析式的总结。

**核心要求：**
1. 只分析"用户"的表达，不要分析AI的内容
2. 从用户的原话中提炼观点，不要总结AI说了什么
3. 给出具体、可操作的改进建议，带实际例子
4. 为每个评分维度提供具体的例证

请按以下 JSON 格式输出（必须是有效的JSON）：

{
  "coreInsights": ["用户观点1", "用户观点2", "..."],
  "thinkingProcess": "用户思考的逻辑链条",
  "clarityScore": 1-5,
  "clarityExample": "具体体现清晰度的用户表达例子",
  "logicScore": 1-5,
  "logicExample": "具体体现逻辑性的用户表达例子",
  "depthScore": 1-5,
  "depthExample": "具体体现深度的用户表达例子",
  "improvementTips": ["具体建议1", "具体建议2", "..."]
}

详细说明：

1. **coreInsights（核心观点）**：
   - 只提取用户自己说的观点，3-5个
   - 用用户的原话精简表达，保留用户的表达风格
   - 不要包含"AI提到的"、"AI建议"等内容
   - 例如用户说："我觉得人工智能在教育领域很有潜力" → "人工智能在教育领域很有潜力"

2. **thinkingProcess（思考脉络）**：
   - 100字以内描述用户的思维链条
   - 关注用户如何展开论述，如何连接不同观点
   - 肯定其思考的独特性，但也指出逻辑上的跳跃或不足

3. **clarityScore（清晰度评分）** 1-5分：
   - 评估用户表达是否清晰、具体、易懂
   - 评分标准要严格但公正，3分为合格线

4. **clarityExample（清晰度例证）**：
   - 引用用户的一句话，说明为什么给这个清晰度评分
   - 例如："你说'我认为AI应该有伦理约束'这句话表达很清晰，但缺少具体说明是哪方面的伦理约束"

5. **logicScore（逻辑性评分）** 1-5分：
   - 评估用户论述的逻辑性、连贯性
   - 观点之间是否有因果关系，论证是否充分

6. **logicExample（逻辑性例证）**：
   - 引用用户的表达，说明逻辑性的强弱
   - 例如："你提到'因为技术发展快，所以需要监管'，这个因果逻辑很清晰，体现了良好的推理能力"
   - 或者："你提到A观点后直接说B结论，中间的推理过程可以更明确"

7. **depthScore（思考深度评分）** 1-5分：
   - 评估是否有深入分析，是否考虑多个角度
   - 是否只停留在表面，还是有深层思考

8. **depthExample（深度例证）**：
   - 引用体现思考深度的表达
   - 例如："你不仅提到了AI的优势，还主动思考了潜在风险，这种多角度分析很好"

9. **improvementTips（继续探索）** 2-4条：
   - 提供具体、可操作的改进建议
   - 必须包含实际的例子或具体方法
   - 格式要求：
     a) 指出具体问题："你提到了XX观点，但是..."
     b) 给出改进方向："可以考虑增加XX这样的例子"
     c) 表达方式建议："表达时可以考虑去除'然后'这样的冗余词"
     d) 鼓励和支持："这个方向很好，加油！"

   示例：
   - "你提到'人工智能很重要'，但是没有足够的逻辑和例子来佐证这个观点，可以考虑增加'AI在医疗诊断中的应用'这样的具体案例"
   - "你的表达中多次使用'然后'来连接句子（'我认为XX，然后YY，然后ZZ'），可以尝试用因果关系词（'因为'、'所以'）或并列词（'同时'、'另外'）来替代，会让逻辑更清晰"
   - "你在讨论利弊时提到了好处，可以进一步思考：这些好处的前提条件是什么？在什么情况下可能不成立？"
   - "你的观点很有深度！继续保持这种多角度思考的方式，加油！"

请只返回JSON，不要有其他文字。`;


export async function POST(request: NextRequest) {
  try {
    const { conversation } = await request.json();

    // 构建对话内容
    const conversationText = conversation.messages
      .map((msg: any) => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
      .join('\n\n');

    // 调用 GROQ API 生成总结
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SUMMARY_PROMPT },
        { role: 'user', content: `对话内容：\n\n${conversationText}` }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const summary = JSON.parse(responseText);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error);

    // 返回一个默认的总结
    const defaultSummary = {
      coreInsights: ['对话总结生成中遇到问题'],
      thinkingProcess: '暂无总结',
      clarityScore: 3,
      logicScore: 3,
      depthScore: 3,
      improvementTips: ['建议稍后重试']
    };

    return NextResponse.json({ summary: defaultSummary });
  }
}
