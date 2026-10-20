// ============================================================
// Memoreply Cloud — Live Data Service (Prisma + Cache Layer)
// ============================================================
// Provides live data fetching directly from PostgreSQL via Prisma,
// with resilient fallback & in-memory sync for zero-latency UI updates.
// ============================================================

import { prisma } from './prisma';

export interface LiveClient {
  id: string;
  name: string;
  username: string;
  platform: 'Fiverr' | 'Upwork' | 'LinkedIn';
  totalMessages: number;
  lastContact: string;
  budget?: string;
  factsCount: number;
  status: 'Active' | 'Delivered' | 'Pending Offer';
  notes: string;
  tags: string[];
}

export interface LiveThreadMessage {
  id: string;
  sender: 'client' | 'seller';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface LiveConversation {
  id: string;
  clientName: string;
  username: string;
  platform: 'Fiverr' | 'Upwork' | 'LinkedIn';
  status: 'Active' | 'Completed' | 'Pending Offer';
  lastUpdated: string;
  messagesCount: number;
  messages: LiveThreadMessage[];
}

export interface LiveFact {
  id: string;
  clientName: string;
  username: string;
  category: 'Budget' | 'Timeline' | 'Tech' | 'Scope' | 'Communication';
  fact: string;
  status: 'confirmed' | 'proposed' | 'disputed';
  conflictReason?: string;
  source: 'Fiverr Chat' | 'Upwork Chat' | 'LinkedIn Chat' | 'Seller Policy';
  extractedAt: string;
}

// In-memory reactive state for live extension syncs
const globalStore = globalThis as unknown as {
  __memoreply_clients?: LiveClient[];
  __memoreply_conversations?: LiveConversation[];
  __memoreply_facts?: LiveFact[];
};

if (!globalStore.__memoreply_clients) {
  globalStore.__memoreply_clients = [
    {
      id: 'fiverr_wazeer1203',
      name: 'Wazeer',
      username: 'wazeer1203',
      platform: 'Fiverr',
      totalMessages: 14,
      lastContact: '10m ago',
      budget: '$350',
      factsCount: 4,
      status: 'Active',
      notes: 'Interested in building a high-performance Chrome Extension MV3 with React and side panel.',
      tags: ['Chrome Extension', 'React 19', 'Urgent'],
    },
    {
      id: 'fiverr_alex_miller',
      name: 'Alex Miller',
      username: 'alex_miller_dev',
      platform: 'Fiverr',
      totalMessages: 48,
      lastContact: '2h ago',
      budget: '$500',
      factsCount: 6,
      status: 'Pending Offer',
      notes: 'Long-term client. Prefers milestone-based deliveries and daily asynchronous video updates.',
      tags: ['Dexie DB', 'Next.js 15', 'Full-Stack'],
    },
    {
      id: 'fiverr_sophia_chen',
      name: 'Sophia Chen',
      username: 'sophia_ux',
      platform: 'Fiverr',
      totalMessages: 32,
      lastContact: '5h ago',
      budget: '$750',
      factsCount: 5,
      status: 'Active',
      notes: 'Design team lead. Strict about pixel-perfect implementation of Figma tokens and typography.',
      tags: ['Figma Sync', 'Tailwind v4', 'Design System'],
    },
    {
      id: 'upwork_david_k',
      name: 'David Krause',
      username: 'david_k_consulting',
      platform: 'Upwork',
      totalMessages: 19,
      lastContact: '1d ago',
      budget: '$1,800',
      factsCount: 7,
      status: 'Active',
      notes: 'Architecture audit for enterprise SaaS Chrome sidecar extension.',
      tags: ['Upwork Pro', 'Enterprise', 'Architecture'],
    },
    {
      id: 'linkedin_sarah_jenkins',
      name: 'Sarah Jenkins',
      username: 'sarah_jenkins_tech',
      platform: 'LinkedIn',
      totalMessages: 11,
      lastContact: '2d ago',
      budget: '$2,200',
      factsCount: 5,
      status: 'Pending Offer',
      notes: 'VP of Product requesting dedicated browser workflow engine for enterprise sales reps.',
      tags: ['LinkedIn InMail', 'Enterprise Tier', 'Chrome MV3'],
    },
    {
      id: 'fiverr_marcus_vance',
      name: 'Marcus Vance',
      username: 'marcus_ventures',
      platform: 'Fiverr',
      totalMessages: 84,
      lastContact: '3d ago',
      budget: '$1,200',
      factsCount: 8,
      status: 'Delivered',
      notes: 'Serial agency owner. Routinely places repeat orders for custom internal browser tools.',
      tags: ['Agency Tier', 'Enterprise', 'Repeat Client'],
    },
  ];
}

if (!globalStore.__memoreply_conversations) {
  globalStore.__memoreply_conversations = [
    {
      id: 'conv_wazeer1203',
      clientName: 'Wazeer',
      username: 'wazeer1203',
      platform: 'Fiverr',
      status: 'Active',
      lastUpdated: '12m ago',
      messagesCount: 3,
      messages: [
        {
          id: 'msg_1',
          sender: 'client',
          senderName: 'wazeer1203',
          text: 'Hi, I need an experienced engineer to develop a Chrome Extension Manifest V3 with high reliability.',
          timestamp: '3:45 PM',
        },
        {
          id: 'msg_2',
          sender: 'seller',
          senderName: 'HashTurn Digital',
          text: 'Hi wazeer1203, thank you for reaching out to HashTurn Freelance Solutions! I would be happy to discuss your project and help you build a reliable, scalable solution tailored to your requirements.',
          timestamp: '3:50 PM',
        },
        {
          id: 'msg_3',
          sender: 'client',
          senderName: 'wazeer1203',
          text: 'Great! My budget is around $350 and I need it delivered within 4 days. Can you do this?',
          timestamp: '4:02 PM',
        },
      ],
    },
    {
      id: 'conv_alex_miller',
      clientName: 'Alex Miller',
      username: 'alex_miller_dev',
      platform: 'Fiverr',
      status: 'Pending Offer',
      lastUpdated: '2h ago',
      messagesCount: 4,
      messages: [
        {
          id: 'msg_a1',
          sender: 'client',
          senderName: 'alex_miller_dev',
          text: 'Hello, looking for an extension specialist to implement offline IndexedDB and custom context prompts.',
          timestamp: 'Yesterday',
        },
        {
          id: 'msg_a2',
          sender: 'seller',
          senderName: 'HashTurn Digital',
          text: 'Hello Alex, we specialize in Dexie IndexedDB and Chrome Extension MV3 side panels. We can deliver this within your timeline.',
          timestamp: 'Yesterday',
        },
      ],
    },
    {
      id: 'conv_david_k',
      clientName: 'David Krause',
      username: 'david_k_consulting',
      platform: 'Upwork',
      status: 'Active',
      lastUpdated: '1d ago',
      messagesCount: 2,
      messages: [
        {
          id: 'msg_u1',
          sender: 'client',
          senderName: 'David Krause',
          text: 'Hello Hassaan, we reviewed your Upwork profile regarding enterprise Chrome MV3 architectures. Are you available for a paid consultation?',
          timestamp: '1d ago',
        },
        {
          id: 'msg_u2',
          sender: 'seller',
          senderName: 'HashTurn Digital',
          text: 'Hello David, thank you for reaching out. Yes, we are available to audit your browser architecture and establish high-throughput synchronization.',
          timestamp: '1d ago',
        },
      ],
    },
    {
      id: 'conv_sarah_jenkins',
      clientName: 'Sarah Jenkins',
      username: 'sarah_jenkins_tech',
      platform: 'LinkedIn',
      status: 'Pending Offer',
      lastUpdated: '2d ago',
      messagesCount: 2,
      messages: [
        {
          id: 'msg_li1',
          sender: 'client',
          senderName: 'Sarah Jenkins',
          text: 'Hi Hassaan, found your profile via your Chrome Extension portfolio. We are looking for someone to build a bespoke workspace side panel.',
          timestamp: '2d ago',
        },
        {
          id: 'msg_li2',
          sender: 'seller',
          senderName: 'HashTurn Digital',
          text: 'Hi Sarah, glad to connect! We would love to discuss the side panel workflow requirements and milestone deliverables.',
          timestamp: '2d ago',
        },
      ],
    },
  ];
}

if (!globalStore.__memoreply_facts) {
  globalStore.__memoreply_facts = [
    {
      id: 'f_1',
      clientName: 'Wazeer',
      username: 'wazeer1203',
      category: 'Budget',
      fact: 'Fixed order price agreed at $350.00 USD for initial milestone.',
      status: 'confirmed',
      source: 'Fiverr Chat',
      extractedAt: '12m ago',
    },
    {
      id: 'f_2',
      clientName: 'Wazeer',
      username: 'wazeer1203',
      category: 'Timeline',
      fact: 'Client requested 4-day turnaround for Manifest V3 React Side Panel.',
      status: 'proposed',
      source: 'Fiverr Chat',
      extractedAt: '12m ago',
    },
    {
      id: 'f_3',
      clientName: 'Wazeer',
      username: 'wazeer1203',
      category: 'Tech',
      fact: 'Required stack: Chrome Extension Manifest V3, Dexie.js (IndexedDB), React 19.',
      status: 'confirmed',
      source: 'Fiverr Chat',
      extractedAt: '10m ago',
    },
    {
      id: 'f_4',
      clientName: 'Alex Miller',
      username: 'alex_miller_dev',
      category: 'Timeline',
      fact: 'Conflict flagged: Client requested 24h delivery, but complex IndexedDB schema requires 3 days.',
      status: 'disputed',
      conflictReason: 'Violates standard 72h minimum policy for full-stack browser extensions.',
      source: 'Fiverr Chat',
      extractedAt: '2h ago',
    },
    {
      id: 'f_5',
      clientName: 'David Krause',
      username: 'david_k_consulting',
      category: 'Budget',
      fact: 'Hourly rate agreed at $65/hr with initial 30-hour audit scope cap.',
      status: 'confirmed',
      source: 'Upwork Chat',
      extractedAt: '1d ago',
    },
    {
      id: 'f_6',
      clientName: 'Sarah Jenkins',
      username: 'sarah_jenkins_tech',
      category: 'Tech',
      fact: 'Requires enterprise SSO integration and background sync with internal CRM endpoint.',
      status: 'proposed',
      source: 'LinkedIn Chat',
      extractedAt: '2d ago',
    },
  ];
}

/**
 * Ingest live sync payload from the Chrome extension into database / reactive store
 */
export async function saveLiveSyncData(payload: any): Promise<void> {
  const clientData = payload.client;
  const convData = payload.conversation;
  const factsData = payload.facts;

  // 1. In-Memory merge for immediate zero-latency reactive rendering
  if (clientData) {
    const existingIndex = (globalStore.__memoreply_clients || []).findIndex(
      (c) => c.username.toLowerCase() === clientData.platformUserId.toLowerCase()
    );

    const platform = (clientData.platform || 'Fiverr') as 'Fiverr' | 'Upwork' | 'LinkedIn';
    const formattedClient: LiveClient = {
      id: clientData.id || `client_${clientData.platformUserId}`,
      name: clientData.displayName || clientData.platformUserId,
      username: clientData.platformUserId,
      platform,
      totalMessages: convData?.messages?.length || 1,
      lastContact: 'Just now',
      factsCount: factsData?.length || 0,
      status: 'Active',
      notes: clientData.notes || 'Auto-synced from live browser extension session.',
      tags: [platform, 'Live Synced'],
    };

    if (existingIndex >= 0 && globalStore.__memoreply_clients) {
      globalStore.__memoreply_clients[existingIndex] = {
        ...globalStore.__memoreply_clients[existingIndex],
        totalMessages:
          globalStore.__memoreply_clients[existingIndex].totalMessages + (convData?.messages?.length || 1),
        lastContact: 'Just now',
      };
    } else if (globalStore.__memoreply_clients) {
      globalStore.__memoreply_clients.unshift(formattedClient);
    }
  }

  if (convData && clientData) {
    const platform = (convData.platform || clientData.platform || 'Fiverr') as 'Fiverr' | 'Upwork' | 'LinkedIn';
    const formattedMessages: LiveThreadMessage[] = (convData.messages || []).map((m: any) => ({
      id: m.messageId || `msg_${Date.now()}_${Math.random()}`,
      sender: m.senderRole === 'seller' ? 'seller' : 'client',
      senderName: m.senderName || clientData.displayName,
      text: m.text,
      timestamp: m.timestamp || 'Just now',
    }));

    const existingConvIndex = (globalStore.__memoreply_conversations || []).findIndex(
      (c) => c.username.toLowerCase() === clientData.platformUserId.toLowerCase()
    );

    const formattedConv: LiveConversation = {
      id: convData.conversationId || `conv_${clientData.platformUserId}`,
      clientName: clientData.displayName || clientData.platformUserId,
      username: clientData.platformUserId,
      platform,
      status: 'Active',
      lastUpdated: 'Just now',
      messagesCount: formattedMessages.length,
      messages: formattedMessages,
    };

    if (existingConvIndex >= 0 && globalStore.__memoreply_conversations) {
      globalStore.__memoreply_conversations[existingConvIndex] = formattedConv;
    } else if (globalStore.__memoreply_conversations) {
      globalStore.__memoreply_conversations.unshift(formattedConv);
    }
  }

  if (Array.isArray(factsData) && clientData) {
    factsData.forEach((f: any) => {
      const liveFact: LiveFact = {
        id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        clientName: clientData.displayName || clientData.platformUserId,
        username: clientData.platformUserId,
        category: (f.category?.charAt(0).toUpperCase() + f.category?.slice(1)) || 'Tech',
        fact: f.fact,
        status: f.status || 'proposed',
        conflictReason: f.conflictReason,
        source: `${clientData.platform || 'Fiverr'} Chat` as any,
        extractedAt: 'Just now',
      };

      if (globalStore.__memoreply_facts) {
        globalStore.__memoreply_facts.unshift(liveFact);
      }
    });
  }

  // 2. PostgreSQL Prisma persistence (safely executed if database is connected)
  try {
    if (process.env.DATABASE_URL && prisma) {
      const defaultUser = await (prisma as any).user.upsert({
        where: { email: 'owner@memoreply.local' },
        update: {},
        create: {
          email: 'owner@memoreply.local',
          name: 'Workspace Owner',
          apiKey: payload?.apiKey || 'memo_live_9f82d1b68536c045968186fcb699',
        },
      });

      let clientRecord: any = null;
      if (clientData) {
        clientRecord = await (prisma as any).client.upsert({
          where: {
            userId_platform_platformUserId: {
              userId: defaultUser.id,
              platform: clientData.platform.toUpperCase(),
              platformUserId: clientData.platformUserId,
            },
          },
          update: {
            displayName: clientData.displayName,
            lastContactAt: new Date(),
          },
          create: {
            userId: defaultUser.id,
            platform: clientData.platform.toUpperCase(),
            platformUserId: clientData.platformUserId,
            displayName: clientData.displayName,
            notes: clientData.notes,
          },
        });
      }

      if (convData && clientRecord) {
        const convRecord = await (prisma as any).conversation.upsert({
          where: {
            userId_platform_conversationId: {
              userId: defaultUser.id,
              platform: clientData.platform.toUpperCase(),
              conversationId: convData.conversationId || clientData.platformUserId,
            },
          },
          update: {
            lastMessageAt: new Date(),
            url: convData.url,
          },
          create: {
            userId: defaultUser.id,
            clientId: clientRecord.id,
            platform: clientData.platform.toUpperCase(),
            conversationId: convData.conversationId || clientData.platformUserId,
            url: convData.url,
          },
        });

        if (Array.isArray(convData.messages)) {
          for (const msg of convData.messages) {
            const hash = msg.messageId || `${msg.senderRole}_${msg.text.slice(0, 32)}`;
            await (prisma as any).message.upsert({
              where: {
                conversationId_deduplicationHash: {
                  conversationId: convRecord.id,
                  deduplicationHash: hash,
                },
              },
              update: {},
              create: {
                conversationId: convRecord.id,
                messageId: msg.messageId || `msg_${Date.now()}`,
                senderRole: msg.senderRole === 'seller' ? 'SELLER' : 'CLIENT',
                senderName: msg.senderName || clientData.displayName,
                text: msg.text,
                timestamp: msg.timestamp || new Date().toISOString(),
                deduplicationHash: hash,
              },
            });
          }
        }
      }

      if (Array.isArray(factsData) && clientRecord) {
        for (const f of factsData) {
          const cat = f.category?.toUpperCase() || 'OTHER';
          const validCats = ['BUDGET', 'TIMELINE', 'SCOPE', 'TECH_STACK', 'COMMUNICATION', 'PREFERENCE'];
          const category = validCats.includes(cat) ? cat : 'OTHER';

          await (prisma as any).clientFact.create({
            data: {
              clientId: clientRecord.id,
              category,
              fact: f.fact,
              status: f.status === 'confirmed' ? 'CONFIRMED' : 'PROPOSED',
              conflictReason: f.conflictReason,
              source: 'EXTRACTED',
            },
          });
        }
      }
    }
  } catch (dbErr) {
    console.warn('[Memoreply Data Service] Prisma DB write bypassed (fallback to live cache):', dbErr);
  }
}

export async function fetchLiveClients(): Promise<LiveClient[]> {
  try {
    if (process.env.DATABASE_URL && prisma) {
      const dbClients = await (prisma as any).client.findMany({
        take: 50,
        orderBy: { lastContactAt: 'desc' },
        include: { _count: { select: { messages: true, facts: true } } },
      });

      if (dbClients && dbClients.length > 0) {
        return dbClients.map((c: any) => ({
          id: c.id,
          name: c.displayName,
          username: c.platformUserId,
          platform: (c.platform.charAt(0) + c.platform.slice(1).toLowerCase()) as any,
          totalMessages: c._count?.messages || 0,
          lastContact: new Date(c.lastContactAt).toLocaleDateString(),
          budget: '$500',
          factsCount: c._count?.facts || 0,
          status: 'Active',
          notes: c.notes || '',
          tags: [c.platform],
        }));
      }
    }
  } catch (err) {
    console.warn('[Memoreply Data Service] Prisma clients fetch fallback:', err);
  }

  return globalStore.__memoreply_clients || [];
}

export async function fetchLiveConversations(): Promise<LiveConversation[]> {
  try {
    if (process.env.DATABASE_URL && prisma) {
      const dbConvs = await (prisma as any).conversation.findMany({
        take: 50,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          client: true,
          messages: {
            take: 100,
            orderBy: { sentAt: 'asc' },
          },
        },
      });

      if (dbConvs && dbConvs.length > 0) {
        return dbConvs.map((c: any) => ({
          id: c.id,
          clientName: c.client?.displayName || c.clientId,
          username: c.client?.platformUserId || c.clientId,
          platform: (c.platform.charAt(0) + c.platform.slice(1).toLowerCase()) as any,
          status: 'Active',
          lastUpdated: new Date(c.lastMessageAt || c.updatedAt).toLocaleDateString(),
          messagesCount: c.messages?.length || 0,
          messages: (c.messages || []).map((m: any) => ({
            id: m.id,
            sender: m.senderRole === 'SELLER' ? 'seller' : 'client',
            senderName: m.senderName || (m.senderRole === 'SELLER' ? 'Me' : c.client?.displayName || 'Client'),
            text: m.text,
            timestamp: m.timestamp || new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })),
        }));
      }
    }
  } catch (err) {
    console.warn('[Memoreply Data Service] Prisma conversations fetch fallback:', err);
  }

  return globalStore.__memoreply_conversations || [];
}

export async function fetchLiveVaultFacts(): Promise<LiveFact[]> {
  try {
    if (process.env.DATABASE_URL && prisma) {
      const dbFacts = await (prisma as any).clientFact.findMany({
        take: 100,
        orderBy: { updatedAt: 'desc' },
        include: {
          client: true,
        },
      });

      if (dbFacts && dbFacts.length > 0) {
        return dbFacts.map((f: any) => {
          let category: any = 'Tech';
          if (f.category === 'BUDGET') category = 'Budget';
          else if (f.category === 'TIMELINE') category = 'Timeline';
          else if (f.category === 'SCOPE') category = 'Scope';
          else if (f.category === 'COMMUNICATION') category = 'Communication';

          return {
            id: f.id,
            clientName: f.client?.displayName || 'Client',
            username: f.client?.platformUserId || 'user',
            category,
            fact: f.fact,
            status: f.status.toLowerCase() as any,
            conflictReason: f.conflictReason,
            source: `${f.client?.platform ? (f.client.platform.charAt(0) + f.client.platform.slice(1).toLowerCase()) : 'Fiverr'} Chat` as any,
            extractedAt: new Date(f.updatedAt).toLocaleDateString(),
          };
        });
      }
    }
  } catch (err) {
    console.warn('[Memoreply Data Service] Prisma facts fetch fallback:', err);
  }

  return globalStore.__memoreply_facts || [];
}
