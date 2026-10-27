// ============================================================
// Memoreply — Injected Floating Extension UI (Vite MV3)
// ============================================================
// Lightweight, sleek, draggable floating widget injected into
// supported platforms (Fiverr, Upwork, LinkedIn chat interfaces).
// Isolated inside Shadow DOM to guarantee zero CSS bleeding.
// ============================================================

export interface FloatingWidgetOptions {
  platform: 'fiverr' | 'upwork' | 'linkedin' | string;
  onExtract: () => {
    clientDisplayName: string | null;
    messagesCount: number;
    platform: string;
    conversationId: string | null;
  };
  onInsertDraft: (text: string) => { success: boolean; message?: string; error?: string };
}

interface TemplateItem {
  id: string;
  badge: string;
  title: string;
  desc: string;
  getText: (clientName: string) => string;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'scope_reminder',
    badge: 'Scope Reminder',
    title: 'Polite Scope Boundary',
    desc: 'Clarifies that extra deliverables require a separate milestone offer.',
    getText: (name) =>
      `Hi ${name || 'there'},\n\nThanks for reaching out! Regarding the additional deliverable requested, that falls outside our original agreed project scope. I'd love to help you get this done—I can set up a quick separate milestone offer at our standard rate so we keep everything organized. Let me know if that sounds good to you!`,
  },
  {
    id: 'milestone_approval',
    badge: 'Milestone Done',
    title: 'Ready for Review & Approval',
    desc: 'Notifies client of milestone completion and prompts next phase approval.',
    getText: (name) =>
      `Hi ${name || 'there'},\n\nI've completed all items for this milestone as discussed! The updated files are uploaded for your review. Please inspect them and let me know if you have any questions or are ready to approve this milestone so we can start on the next step.`,
  },
  {
    id: 'rush_delivery',
    badge: 'Rush Option',
    title: 'Rush Delivery Overtime Fee',
    desc: 'Offers early delivery ahead of queue with a dedicated rush fee.',
    getText: (name) =>
      `Hi ${name || 'there'},\n\nUnderstood! Delivering ahead of schedule would require overtime and prioritizing your project ahead of other queue orders. I can definitely make the earlier date work with a rush fee, or we can stick to our confirmed date at the agreed rate. Which do you prefer?`,
  },
  {
    id: 'platform_terms',
    badge: 'Safety',
    title: 'Platform Terms & Safety',
    desc: 'Keeps all payments, files, and agreements safe inside platform policy.',
    getText: (name) =>
      `Hi ${name || 'there'},\n\nSounds like a plan! Just a quick reminder that all milestone offers, deliverables, and payments will be handled directly through this platform to ensure we're both protected under platform terms. Looking forward to our next steps!`,
  },
];

export class MemoreplyFloatingWidget {
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private isExpanded: boolean = false;
  private activeTab: 'actions' | 'templates' | 'terms' = 'actions';
  private clientName: string = 'Client';
  private messagesCount: number = 0;
  private options: FloatingWidgetOptions;

  // Dragging state
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;

  constructor(options: FloatingWidgetOptions) {
    this.options = options;
  }

  /**
   * Mounts the widget into the page via Shadow DOM
   */
  public mount(): void {
    // Avoid duplicate mount
    if (document.getElementById('memoreply-floating-root')) {
      return;
    }

    this.host = document.createElement('div');
    this.host.id = 'memoreply-floating-root';
    this.host.style.position = 'fixed';
    this.host.style.zIndex = '2147483647';
    this.host.style.bottom = '24px';
    this.host.style.right = '24px';
    this.host.style.userSelect = 'none';

    this.shadow = this.host.attachShadow({ mode: 'open' });
    this.render();

    document.body.appendChild(this.host);
    this.attachEvents();

    // Trigger initial silent scan
    setTimeout(() => {
      this.handleExtract(false);
    }, 1200);
  }

  /**
   * Update internal state from conversation updates
   */
  public updateState(clientName: string | null, messagesCount: number): void {
    if (clientName) this.clientName = clientName;
    this.messagesCount = messagesCount;
    this.render();
  }

  private handleExtract(showToast: boolean = true): void {
    try {
      const data = this.options.onExtract();
      if (data.clientDisplayName) {
        this.clientName = data.clientDisplayName;
      }
      this.messagesCount = data.messagesCount;
      this.render();

      if (showToast) {
        this.showToast(`Extracted ${data.messagesCount} msgs • ${this.clientName}`);
      }
    } catch {
      if (showToast) {
        this.showToast('Could not extract thread.', true);
      }
    }
  }

  private handleInsertTemplate(templateId: string): void {
    const tmpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    const text = tmpl.getText(this.clientName);
    const res = this.options.onInsertDraft(text);

    if (res.success) {
      this.showToast('Polite reply inserted into composer!');
    } else {
      this.showToast(res.error || 'Failed to insert draft', true);
    }
  }

  private handleInsertTerms(): void {
    const termsSummary =
      `Hi ${this.clientName || 'there'},\n\n` +
      `Here is a quick summary of our agreed project terms:\n` +
      `• Platform: ${this.options.platform.toUpperCase()}\n` +
      `• Milestones: Work deliverables handled as discussed\n` +
      `• Timeline: Confirmed per platform delivery date\n\n` +
      `Please let me know if everything matches your expectations so we can proceed!`;

    const res = this.options.onInsertDraft(termsSummary);
    if (res.success) {
      this.showToast('Agreed terms ledger inserted!');
    } else {
      this.showToast(res.error || 'Failed to insert terms', true);
    }
  }

  private showToast(message: string, isError: boolean = false): void {
    if (!this.shadow) return;
    const toast = this.shadow.getElementById('mr-toast');
    if (!toast) return;

    toast.textContent = message;
    toast.style.background = isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)';
    toast.style.color = '#ffffff';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
      if (toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
      }
    }, 2400);
  }

  private render(): void {
    if (!this.shadow) return;

    const platformUpper = this.options.platform.toUpperCase();

    this.shadow.innerHTML = `
      <style>
        /* ── Memoreply Brand Typography ────────────────────────── */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          /* Inter / Geist / SF Pro stack for UI elements */
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, sans-serif;
        }

        /* JetBrains Mono for version tags, ledger terms, platform chips */
        .mono, code, kbd {
          font-family: "JetBrains Mono", "Fira Code", "Cascadia Code",
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-feature-settings: "liga" 1, "calt" 1;
        }

        .mr-widget {
          position: relative;
          color: #f4f4f5;
          font-size: 12px;
          line-height: 1.4;
          filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.45));
        }

        /* Pill (Minimized) */
        .mr-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #09090b;
          border: 1px solid #27272a;
          padding: 6px 12px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .mr-pill:hover {
          border-color: #3f3f46;
          background: #18181b;
          transform: translateY(-1px);
        }

        .mr-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
          animation: mr-pulse 2s infinite;
        }

        @keyframes mr-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }

        .mr-brand-name {
          font-weight: 700;
          font-size: 11px;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .mr-platform-chip {
          font-size: 9px;
          font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace;
          font-feature-settings: "liga" 1, "calt" 1;
          background: #27272a;
          color: #a1a1aa;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .mr-msgs-badge {
          font-size: 10px;
          color: #10b981;
          font-weight: 600;
          font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace;
          font-feature-settings: "liga" 1, "calt" 1;
        }

        /* Expanded Card */
        .mr-card {
          width: 320px;
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
          animation: mr-fade-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes mr-fade-in {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Top Accent Beam */
        .mr-laser-beam {
          height: 2px;
          width: 100%;
          background: linear-gradient(90deg, #10b981 0%, #6366f1 50%, transparent 100%);
        }

        /* Card Header */
        .mr-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid #18181b;
          background: #0d0d10;
          cursor: grab;
        }

        .mr-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mr-drag-handle {
          color: #71717a;
          font-size: 12px;
          margin-right: 2px;
          cursor: grab;
        }

        .mr-header-title {
          font-weight: 700;
          font-size: 12px;
          color: #ffffff;
        }

        .mr-close-btn {
          background: transparent;
          border: none;
          color: #71717a;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 6px;
          font-size: 11px;
          transition: all 0.15s;
        }

        .mr-close-btn:hover {
          color: #ffffff;
          background: #27272a;
        }

        /* Client Info Row */
        .mr-client-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          background: #121216;
          border-bottom: 1px solid #18181b;
          font-size: 11px;
        }

        .mr-client-name {
          font-weight: 600;
          color: #e4e4e7;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* Tab Switcher */
        .mr-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          padding: 6px 10px;
          background: #09090b;
          gap: 4px;
          border-bottom: 1px solid #18181b;
        }

        .mr-tab-btn {
          background: transparent;
          border: 1px solid transparent;
          color: #a1a1aa;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 10.5px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
        }

        .mr-tab-btn.active {
          background: #18181b;
          border-color: #27272a;
          color: #ffffff;
        }

        .mr-tab-btn:hover:not(.active) {
          color: #e4e4e7;
          background: #121215;
        }

        /* Body Views */
        .mr-body {
          padding: 12px 14px;
          max-height: 280px;
          overflow-y: auto;
        }

        /* Actions View */
        .mr-action-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mr-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #27272a;
          background: #18181b;
          color: #f4f4f5;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .mr-btn:hover {
          background: #27272a;
          border-color: #3f3f46;
          color: #ffffff;
          transform: translateY(-0.5px);
        }

        .mr-btn-primary {
          background: #10b981;
          color: #09090b;
          border-color: #059669;
          font-weight: 700;
        }

        .mr-btn-primary:hover {
          background: #34d399;
          border-color: #10b981;
          color: #09090b;
        }

        /* Templates View */
        .mr-template-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mr-template-card {
          padding: 8px 10px;
          background: #121216;
          border: 1px solid #27272a;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .mr-template-card:hover {
          border-color: #6366f1;
          background: #181820;
        }

        .mr-template-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .mr-template-badge {
          font-size: 9px;
          font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", ui-monospace, monospace;
          font-feature-settings: "liga" 1, "calt" 1;
          padding: 1px 5px;
          border-radius: 4px;
          background: #1e1b4b;
          color: #818cf8;
          border: 1px solid #312e81;
        }

        .mr-template-title {
          font-weight: 600;
          font-size: 11px;
          color: #f4f4f5;
        }

        .mr-template-desc {
          font-size: 10px;
          color: #a1a1aa;
          line-height: 1.3;
        }

        /* Toast Feedback */
        .mr-toast {
          position: absolute;
          bottom: 10px;
          left: 12px;
          right: 12px;
          padding: 7px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          box-shadow: 0 4px 14px rgba(0,0,0,0.4);
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          z-index: 10;
        }

        /* Scrollbar */
        .mr-body::-webkit-scrollbar {
          width: 4px;
        }
        .mr-body::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 4px;
        }
      </style>

      <div class="mr-widget">
        ${
          !this.isExpanded
            ? `
          <!-- Minimized Floating Pill -->
          <div class="mr-pill" id="mr-pill-toggle">
            <span class="mr-status-dot"></span>
            <span class="mr-brand-name">MEMOREPLY</span>
            <span class="mr-platform-chip">${platformUpper}</span>
            <span class="mr-msgs-badge">${this.messagesCount > 0 ? `${this.messagesCount} msgs` : 'Ready'}</span>
          </div>
        `
            : `
          <!-- Expanded Card View -->
          <div class="mr-card">
            <div class="mr-laser-beam"></div>

            <!-- Header -->
            <div class="mr-header" id="mr-drag-header">
              <div class="mr-header-left">
                <span class="mr-drag-handle">⋮⋮</span>
                <span class="mr-status-dot"></span>
                <span class="mr-header-title">Memoreply Companion</span>
              </div>
              <button class="mr-close-btn" id="mr-collapse-btn" title="Minimize floating bar">
                —
              </button>
            </div>

            <!-- Client Info Row -->
            <div class="mr-client-info">
              <span class="mr-client-name">
                <span>👤</span>
                <span>${this.clientName}</span>
              </span>
              <span class="mr-platform-chip">${platformUpper} &bull; ${this.messagesCount} msgs</span>
            </div>

            <!-- Tabs -->
            <div class="mr-tabs">
              <button class="mr-tab-btn ${this.activeTab === 'actions' ? 'active' : ''}" data-tab="actions">
                ⚡ Actions
              </button>
              <button class="mr-tab-btn ${this.activeTab === 'templates' ? 'active' : ''}" data-tab="templates">
                💬 Replies
              </button>
              <button class="mr-tab-btn ${this.activeTab === 'terms' ? 'active' : ''}" data-tab="terms">
                📌 Terms
              </button>
            </div>

            <!-- Body Contents -->
            <div class="mr-body">
              ${
                this.activeTab === 'actions'
                  ? `
                <div class="mr-action-grid">
                  <button class="mr-btn mr-btn-primary" id="mr-btn-extract">
                    <span>⚡ Extract Thread Memory</span>
                    <span style="font-size: 10px; font-weight: normal;">Scan DOM &rarr;</span>
                  </button>

                  <button class="mr-btn" id="mr-btn-quick-scope">
                    <span>🛡️ Insert Scope Reminder</span>
                    <span style="color: #a1a1aa; font-size: 10px;">1-Click &rarr;</span>
                  </button>

                  <button class="mr-btn" id="mr-btn-quick-milestone">
                    <span>✅ Insert Milestone Done</span>
                    <span style="color: #a1a1aa; font-size: 10px;">1-Click &rarr;</span>
                  </button>

                  <button class="mr-btn" id="mr-btn-quick-terms">
                    <span>📋 Paste Agreed Terms</span>
                    <span style="color: #a1a1aa; font-size: 10px;">To Composer &rarr;</span>
                  </button>
                </div>
              `
                  : this.activeTab === 'templates'
                  ? `
                <div class="mr-template-list">
                  ${TEMPLATES.map(
                    (tmpl) => `
                    <div class="mr-template-card" data-template-id="${tmpl.id}">
                      <div class="mr-template-header">
                        <span class="mr-template-title">${tmpl.title}</span>
                        <span class="mr-template-badge">${tmpl.badge}</span>
                      </div>
                      <p class="mr-template-desc">${tmpl.desc}</p>
                    </div>
                  `
                  ).join('')}
                </div>
              `
                  : `
                <!-- Terms View -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="background: #121216; border: 1px solid #27272a; border-radius: 8px; padding: 10px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                      <span style="color: #71717a;">Client:</span>
                      <span style="color: #ffffff; font-weight: 600;">${this.clientName}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                      <span style="color: #71717a;">Platform:</span>
                      <span style="color: #ffffff; font-weight: 600;">${platformUpper}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                      <span style="color: #71717a;">Messages Scanned:</span>
                      <span style="color: #10b981; font-weight: 600;">${this.messagesCount}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #71717a;">Memory Status:</span>
                      <span style="color: #10b981; font-weight: 600;">Active Sandbox</span>
                    </div>
                  </div>

                  <button class="mr-btn mr-btn-primary" id="mr-btn-insert-terms-now">
                    <span>📌 Insert Confirmed Terms to Composer</span>
                  </button>
                </div>
              `
              }
            </div>

            <!-- Toast alert inside shadow root -->
            <div class="mr-toast" id="mr-toast"></div>
          </div>
        `
        }
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    if (!this.shadow) return;

    // Toggle expand/collapse
    const pillToggle = this.shadow.getElementById('mr-pill-toggle');
    if (pillToggle) {
      pillToggle.addEventListener('click', () => {
        this.isExpanded = true;
        this.render();
      });
    }

    const collapseBtn = this.shadow.getElementById('mr-collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        this.isExpanded = false;
        this.render();
      });
    }

    // Tabs
    const tabBtns = this.shadow.querySelectorAll<HTMLButtonElement>('.mr-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab') as 'actions' | 'templates' | 'terms';
        if (tab) {
          this.activeTab = tab;
          this.render();
        }
      });
    });

    // Action buttons
    const btnExtract = this.shadow.getElementById('mr-btn-extract');
    if (btnExtract) {
      btnExtract.addEventListener('click', () => this.handleExtract(true));
    }

    const btnQuickScope = this.shadow.getElementById('mr-btn-quick-scope');
    if (btnQuickScope) {
      btnQuickScope.addEventListener('click', () => this.handleInsertTemplate('scope_reminder'));
    }

    const btnQuickMilestone = this.shadow.getElementById('mr-btn-quick-milestone');
    if (btnQuickMilestone) {
      btnQuickMilestone.addEventListener('click', () => this.handleInsertTemplate('milestone_approval'));
    }

    const btnQuickTerms = this.shadow.getElementById('mr-btn-quick-terms');
    if (btnQuickTerms) {
      btnQuickTerms.addEventListener('click', () => this.handleInsertTerms());
    }

    const btnInsertTermsNow = this.shadow.getElementById('mr-btn-insert-terms-now');
    if (btnInsertTermsNow) {
      btnInsertTermsNow.addEventListener('click', () => this.handleInsertTerms());
    }

    // Template cards click
    const tmplCards = this.shadow.querySelectorAll<HTMLDivElement>('.mr-template-card');
    tmplCards.forEach((card) => {
      card.addEventListener('click', () => {
        const tmplId = card.getAttribute('data-template-id');
        if (tmplId) {
          this.handleInsertTemplate(tmplId);
        }
      });
    });

    // Draggable header
    const header = this.shadow.getElementById('mr-drag-header');
    if (header && this.host) {
      header.addEventListener('mousedown', (e) => {
        if ((e.target as HTMLElement).id === 'mr-collapse-btn') return;
        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;

        const rect = this.host!.getBoundingClientRect();
        this.currentX = rect.left;
        this.currentY = rect.top;

        const onMouseMove = (moveEvent: MouseEvent) => {
          if (!this.isDragging || !this.host) return;
          const dx = moveEvent.clientX - this.startX;
          const dy = moveEvent.clientY - this.startY;

          let newX = this.currentX + dx;
          let newY = this.currentY + dy;

          // Clamp to screen boundaries
          const maxX = window.innerWidth - (this.host.offsetWidth || 320);
          const maxY = window.innerHeight - (this.host.offsetHeight || 200);

          newX = Math.max(10, Math.min(newX, maxX - 10));
          newY = Math.max(10, Math.min(newY, maxY - 10));

          this.host.style.left = `${newX}px`;
          this.host.style.top = `${newY}px`;
          this.host.style.bottom = 'auto';
          this.host.style.right = 'auto';
        };

        const onMouseUp = () => {
          this.isDragging = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }
  }
}
