import { NextRequest, NextResponse } from 'next/server';

interface GeneratePayload {
  systemPrompt?: string;
  userPrompt?: string;
  tone?: string;
  clientName?: string;
  facts?: Array<{ category: string; fact: string }>;
  sellerKnowledge?: {
    businessName?: string;
    roleTitle?: string;
    servicesOffered?: string[];
    coreSkills?: string[];
    revisionPolicy?: string;
    pricingPolicy?: string;
    customRules?: string;
  };
  customInstruction?: string;
  action?: 'generate' | 'shorten' | 'expand' | 'milestone' | 'rephrase';
  currentDraft?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Api-Key',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: GeneratePayload = await req.json();
    const {
      systemPrompt,
      userPrompt,
      tone = 'Professional',
      clientName = 'Client',
      facts = [],
      sellerKnowledge,
      customInstruction,
      action = 'generate',
      currentDraft,
    } = body;

    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

    // 1. If live OpenAI or OpenRouter API key is configured, call official API
    if (apiKey) {
      try {
        const isRouter = Boolean(process.env.OPENROUTER_API_KEY);
        const endpoint = isRouter
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
        const model = isRouter ? 'meta-llama/llama-3.3-70b-instruct' : 'gpt-4o-mini';

        let promptContent = userPrompt || `Draft a response for client ${clientName}. Tone: ${tone}.`;
        if (action === 'shorten' && currentDraft) {
          promptContent = `Make this message significantly more concise while retaining essential details:\n\n${currentDraft}`;
        } else if (action === 'expand' && currentDraft) {
          promptContent = `Elaborate on this response with clear milestones, deliverables, and technical clarity:\n\n${currentDraft}`;
        } else if (action === 'milestone' && currentDraft) {
          promptContent = `Add a structured milestone proposal and pricing breakdown to this message:\n\n${currentDraft}`;
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            ...(isRouter ? { 'HTTP-Referer': 'https://memoreply.local' } : {}),
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  systemPrompt ||
                  'You are an expert freelance communications assistant. Write human, professional responses.',
              },
              { role: 'user', content: promptContent },
            ],
            temperature: 0.7,
            max_tokens: 650,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const replyText = data.choices?.[0]?.message?.content?.trim();
          if (replyText) {
            return NextResponse.json(
              {
                success: true,
                replyText,
                model,
                tone,
                source: 'api',
              },
              { headers: corsHeaders }
            );
          }
        }
      } catch (apiErr) {
        console.warn('[Generate API] Upstream LLM call failed, falling back to deterministic engine:', apiErr);
      }
    }

    // 2. High-precision contextual deterministic generator (zero API key / offline mode)
    const businessName = sellerKnowledge?.businessName || 'HashTurn Digital';
    const skills = sellerKnowledge?.coreSkills?.slice(0, 3).join(', ') || 'Chrome Extensions, React, Full-Stack';
    const budgetFact = facts.find((f) => f.category.toLowerCase().includes('budget'))?.fact;
    const timelineFact = facts.find((f) => f.category.toLowerCase().includes('timeline'))?.fact;
    const techFact = facts.find((f) => f.category.toLowerCase().includes('tech'))?.fact;

    const budgetPhrase = budgetFact ? `within your ${budgetFact.replace(/Budget mentioned:\s*/i, '')}` : 'within agreed scope';
    const timelinePhrase = timelineFact ? `adhering to ${timelineFact.replace(/Timeline requested:\s*/i, '')}` : 'promptly';

    let reply = '';

    if (action === 'shorten' && currentDraft) {
      reply = `Hi ${clientName}, thanks for the update. We can deliver ${timelinePhrase} ${budgetPhrase}. Let's proceed with the milestone offer.`;
    } else if (action === 'expand' && currentDraft) {
      reply = `Hi ${clientName},\n\nThank you for outlining the project requirements with ${businessName}. Here is our planned delivery roadmap:\n\n1. Technical audit & component architecture (${skills})\n2. Sprint implementation ${budgetPhrase}\n3. Complete QA validation and revision sign-off\n\nPlease let me know if you would like me to prepare the initial contract milestone.`;
    } else if (action === 'milestone') {
      reply = `Hi ${clientName},\n\nBased on your specifications, here is the suggested milestone structure:\n• Milestone 1: Core setup & interface architecture\n• Milestone 2: Business logic & integration testing\n• Milestone 3: Final delivery & revisions\n\nDelivery timeline: ${timelinePhrase} ${budgetPhrase}. Ready to initiate when you are!`;
    } else {
      switch (tone) {
        case 'Friendly':
          reply = `Hi ${clientName}! Thanks so much for reaching out to ${businessName}. I'd love to collaborate on this! Delivering ${timelinePhrase} ${budgetPhrase} sounds completely great. I am ready to get started whenever you are!`;
          break;
        case 'Concise':
          reply = `Hi ${clientName}, reviewed the project specifications. At ${businessName}, we can deliver the solution ${timelinePhrase} ${budgetPhrase}. Ready to proceed.`;
          break;
        case 'Persuasive':
          reply = `Hi ${clientName}, thank you for reaching out! With extensive experience in ${skills}, we have successfully delivered similar architectures for enterprise clients. We can guarantee delivery ${timelinePhrase} ${budgetPhrase}. Would you like to review recent portfolio samples?`;
          break;
        case 'Detailed':
          reply = `Hello ${clientName},\n\nThank you for reaching out to ${businessName}. I have carefully reviewed your project notes:\n\n• Delivery Target: ${timelinePhrase}\n• Investment Scope: ${budgetPhrase}\n• Stack Alignment: ${techFact || skills}\n\nAll deliverables include documentation and full test coverage. Looking forward to your confirmation!`;
          break;
        case 'Direct':
          reply = `Hi ${clientName}. Yes, we can handle this deliverable ${timelinePhrase} ${budgetPhrase}. Let me know if you would like me to submit the custom contract offer.`;
          break;
        case 'Professional':
        default:
          reply = `Hi ${clientName},\n\nThank you for contacting ${businessName}. I have reviewed your requirements and would be pleased to assist you. I can guarantee delivery ${timelinePhrase} strictly ${budgetPhrase}.\n\nPlease let me know if you are ready to proceed with a milestone contract.`;
          break;
      }

      if (customInstruction && customInstruction.trim()) {
        reply += `\n\nNote: ${customInstruction.trim()}`;
      }
    }

    return NextResponse.json(
      {
        success: true,
        replyText: reply,
        tone,
        model: 'context-engine-v2',
        source: 'deterministic',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Generate API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate inline response' },
      { status: 500, headers: corsHeaders }
    );
  }
}
