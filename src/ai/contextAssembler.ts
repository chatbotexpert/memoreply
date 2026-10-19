// ============================================================
// Memoreply — Module 3: Context Retrieval & Assembly Engine
// ============================================================
// Retrieves stored conversation messages and confirmed client facts
// from IndexedDB (Dexie), assembling a comprehensive, policy-safe
// prompt for the AI reply generator.
// ============================================================

import { db } from '../db';
import { getSellerKnowledge } from '../db/repository';
import type { AssembledContext } from './types';
import type { ConversationData } from '../types';

interface AssembleContextOptions {
  clientId: string;
  conversationId: string;
  tone: string;
  customInstruction?: string;
  fallbackConversation?: ConversationData | null;
}

/**
 * Tone-specific instructions for the prompt
 */
function getToneInstruction(tone: string): string {
  switch (tone) {
    case 'Friendly':
      return 'Tone: Warm, enthusiastic, collaborative, and approachable. Express excitement about working together while maintaining high competence.';
    case 'Concise':
      return 'Tone: Crisp, direct, and brief (2-4 sentences max). Zero fluff. Confirm details and state next action immediately.';
    case 'Detailed':
      return 'Tone: Comprehensive and structured. Provide a clear step-by-step milestone or roadmap, addressing all technical and timeline requirements systematically.';
    case 'Pitch / Offer':
      return 'Tone: Confident, persuasive, and value-focused. Highlight relevant technical capability, reassure on quality, and ask if the client is ready for a custom offer.';
    case 'Follow-up':
      return 'Tone: Polite, gentle, and courteous check-in. Ask if they have any remaining questions or need portfolio samples, with no aggressive pressure.';
    case 'Professional':
    default:
      return 'Tone: Polished, professional, respectful, and authoritative. Clear, well-structured, and business-focused.';
  }
}

/**
 * Retrieve messages and facts from Dexie to assemble the prompt context.
 */
export async function assembleContext(options: AssembleContextOptions): Promise<AssembledContext> {
  const { clientId, conversationId, tone, customInstruction, fallbackConversation } = options;

  // 1. Fetch Client from Dexie
  const client = await db.clients.get(clientId);
  const clientDisplayName = client?.displayName ?? fallbackConversation?.clientDisplayName ?? 'Client';
  const clientUsername = client?.platformUserId ?? fallbackConversation?.clientUsername ?? 'buyer';
  const clientNotes = client?.notes ?? '';

  // 2. Fetch Facts from Dexie
  let dbFacts = await db.clientFacts.where('clientId').equals(clientId).toArray();

  // Filter out disputed facts so AI replies only rely on verified or proposed context
  const factsList = dbFacts
    .filter((f) => f.status !== 'disputed')
    .map((f) => ({
      category: f.category,
      fact: f.status === 'confirmed' ? `${f.fact} (Confirmed by Seller)` : f.fact,
    }));

  // 3. Fetch Recent Messages from Dexie
  let dbMessages = await db.messages
    .where('conversationId')
    .equals(conversationId)
    .toArray();

  // Sort chronologically and take recent 15
  let recentMessages = dbMessages
    .slice(-15)
    .map((m) => ({
      sender: m.sender,
      senderRole: m.senderRole,
      text: m.text,
      timestamp: m.timestamp,
    }));

  // Fallback if DB was empty but active conversation data exists in React state
  if (recentMessages.length === 0 && fallbackConversation?.messages) {
    recentMessages = fallbackConversation.messages.slice(-15).map((m) => ({
      sender: m.sender,
      senderRole: m.senderRole,
      text: m.text,
      timestamp: m.timestamp,
    }));
  }

  // 4. Fetch Seller Knowledge Base from Dexie
  const seller = await getSellerKnowledge();

  // 5. Build Structured System Prompt
  const systemPrompt = `You are Memoreply, a professional client communication engine representing this agency/freelancer on Fiverr:

### SELLER KNOWLEDGE BASE & FREELANCER PROFILE
- Seller / Brand: ${seller.businessName} (${seller.roleTitle})
- Professional Background & Intro: ${seller.professionalIntro || 'Full-Stack Developer & Extension Specialist'}
- Offered Services: ${seller.servicesOffered.join(', ')}
- Core Technical Skills: ${seller.coreSkills.join(', ')}
- Pricing & Minimum Budget Policy: ${seller.pricingPolicy}
- Revisions Policy: ${seller.revisionPolicy}
- Availability & Working Hours: ${seller.communicationHours}
- Seller Guidelines & Rules: ${seller.customRules}

CRITICAL OPERATIONAL RULES:
1. STRICT FIVERR POLICY COMPLIANCE: NEVER propose or share off-platform contact information (no email addresses, phone numbers, WhatsApp, Telegram, Skype, or direct payments). All communication and payments must stay on Fiverr.
2. REPRESENT SELLER CAPABILITIES: Speak on behalf of ${seller.businessName}. Confidently pitch and propose relevant services from the seller profile and adhere strictly to the seller's pricing and revision rules.
3. KNOWLEDGE BASE GROUNDING: Ground your replies in the seller's actual skills (${seller.coreSkills.join(', ')}) and pricing rules. Never invent arbitrary pricing below the minimum budget, and present the seller's verified capabilities.
4. PERSISTENT CLIENT MEMORY: Naturally integrate the client's known facts (e.g. their budget, requested timeline, technical preferences, or project details) into your reply. Do NOT say robotic phrases like "According to my records" or "As stored in memory" — simply reference their context naturally.
5. ADOPT THE REQUESTED TONE: Strictly follow the specified communication tone.
6. DIRECT & ACTION-ORIENTED: Address the client's latest message directly. Conclude with a clear next step (e.g. asking for project details, proposing a custom offer, or confirming delivery schedule).
7. CLEAN OUTPUT ONLY: Output ONLY the final message text to be sent to the client. Do not include markdown code block ticks, greeting analysis, or explanatory commentary.`;

  // 5. Build Structured User Prompt
  let userPrompt = `### CLIENT PROFILE\n`;
  userPrompt += `- Name: ${clientDisplayName} (@${clientUsername})\n`;
  userPrompt += `- Platform: Fiverr\n`;
  if (clientNotes.trim()) {
    userPrompt += `- Seller's Private Notes: ${clientNotes.trim()}\n`;
  }

  userPrompt += `\n### CLIENT MEMORY & KNOWN CONTEXT\n`;
  if (factsList.length > 0) {
    factsList.forEach((f) => {
      userPrompt += `- [${f.category.toUpperCase()}]: ${f.fact}\n`;
    });
  } else {
    userPrompt += `- No previous recorded facts yet.\n`;
  }

  userPrompt += `\n### CONVERSATION HISTORY (Chronological order)\n`;
  if (recentMessages.length > 0) {
    recentMessages.forEach((msg) => {
      const roleTag = msg.senderRole === 'seller' ? 'Me (Seller)' : `${msg.sender} (Client)`;
      const timeTag = msg.timestamp ? ` [${msg.timestamp}]` : '';
      userPrompt += `${roleTag}${timeTag}:\n${msg.text}\n\n`;
    });
  } else {
    userPrompt += `(No visible previous messages. Treat as a new inquiry.)\n\n`;
  }

  userPrompt += `### RESPONSE GOAL\n`;
  userPrompt += `- ${getToneInstruction(tone)}\n`;
  if (customInstruction?.trim()) {
    userPrompt += `- Custom Directive: ${customInstruction.trim()}\n`;
  }
  userPrompt += `\nPlease write the optimal reply to ${clientDisplayName} right now:`;

  return {
    clientId,
    clientDisplayName,
    clientUsername,
    clientNotes,
    facts: factsList,
    recentMessages,
    systemPrompt,
    userPrompt,
    tone,
  };
}
