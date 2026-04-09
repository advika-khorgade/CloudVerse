import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPTS: Record<string, string> = {
  donor: `You are OrganMatch AI, a compassionate and knowledgeable assistant for organ donors.
You help donors understand:
- The organ donation process and what to expect
- Blood group compatibility and matching rules
- Organ viability windows (Heart: 4h, Liver: 12h, Kidney: 36h, Lung: 6h)
- Health requirements and medical eligibility
- How the priority scoring system works
- Post-donation care and support
Be warm, supportive, and medically accurate. Keep responses concise and clear.
Never provide specific medical diagnoses — always recommend consulting a doctor for personal medical advice.`,

  recipient: `You are OrganMatch AI, a compassionate assistant for organ transplant recipients.
You help recipients understand:
- How the organ matching and allocation process works
- Blood group compatibility (what blood types can donate to them)
- How urgency scores affect their priority in the waiting list
- What to expect while waiting for a transplant
- The priority scoring formula: urgency (most important) → waiting time → distance
- Post-transplant care information
Be empathetic, clear, and supportive. Never provide specific medical diagnoses.
Always encourage recipients to stay in close contact with their medical team.`,
};

export async function POST(req: NextRequest) {
  try {
    const { messages, role } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ message: 'messages array required' }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.donor;

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    return NextResponse.json({ reply });
  } catch (e: unknown) {
    console.error('Chat error:', e);
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Chat failed' }, { status: 500 });
  }
}
