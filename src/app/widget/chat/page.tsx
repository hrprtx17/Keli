'use client';
import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface ChatConfig {
  agentName: string;
  welcomeMessage: string;
  primaryColor: string;
  showBranding: boolean;
}

interface Message {
  role: 'user' | 'agent';
  text: string;
  time: string;
  isTyping?: boolean;   // animated streaming
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ─────────────────────────────────────────────
   INLINE STYLES  (self-contained, no Tailwind)
───────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; background: #fff; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #111827;
}

/* ── Scrollbar ───────────────────────────── */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.15); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.35); }

/* ── Root layout ─────────────────────────── */
.w-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: #ffffff;
  overflow: hidden;
  position: relative;
}

/* ── Header ──────────────────────────────── */
.w-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(12px);
  border-bottom: 1.5px solid rgba(253, 232, 212, 0.6);
  position: relative;
  z-index: 10;
  box-shadow: 0 4px 20px -2px rgba(249, 115, 22, 0.05);
}
/* orange accent line at very top */
.w-header::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #F97316 0%, #fb923c 50%, #fdba74 100%);
}

.w-header-left { display: flex; align-items: center; gap: 12px; }

.w-logo {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, #F97316 0%, #ea580c 100%);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(249,115,22,.25);
}
.w-logo svg { width: 19px; height: 19px; color: #fff; stroke-width: 2.5px; }

.w-title { 
  font-family: 'Outfit', sans-serif;
  font-size: 14.5px; font-weight: 700; color: #111827; letter-spacing: -.02em; line-height: 1.2; 
}
.w-sub {
  font-size: 11px; font-weight: 600; color: #6b7280;
  display: flex; align-items: center; gap: 5px; margin-top: 3px;
}
.w-dot {
  width: 6.5px; height: 6.5px; border-radius: 50%; background: #22c55e;
  animation: pulseDot 2s ease-in-out infinite;
}
@keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:.35} }

.w-actions { display: flex; align-items: center; gap: 2px; }
.w-btn {
  width: 32px; height: 32px; border-radius: 10px; border: none;
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #9ca3af; transition: all 0.2s ease;
}
.w-btn:hover { background: #fff7ed; color: #F97316; }
.w-btn svg { width: 15px; height: 15px; stroke-width: 2.2px; }

/* ── Chat area ───────────────────────────── */
.w-chat {
  flex: 1;
  overflow-y: auto;
  padding: 24px 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: radial-gradient(circle at top left, rgba(255,247,237,0.2) 0%, rgba(255,255,255,0) 60%), #ffffff;
}

/* ── Messages ────────────────────────────── */
.msg-row {
  display: flex;
  margin-bottom: 2px;
  animation: msgIn .32s cubic-bezier(.22,1,.36,1) both;
}
@keyframes msgIn {
  from { opacity:0; transform: translateY(12px) scale(.97); }
  to   { opacity:1; transform: translateY(0)   scale(1);   }
}
.msg-row.agent { justify-content: flex-start; }
.msg-row.user  { justify-content: flex-end;   }

.msg-avatar {
  width: 28px; height: 28px; border-radius: 10px;
  background: #fff7ed; border: 1.5px solid rgba(254, 215, 170, 0.6);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-right: 10px; margin-top: 2px;
  box-shadow: 0 2px 6px rgba(249, 115, 22, 0.05);
}
.msg-avatar svg { width: 14px; height: 14px; color: #F97316; stroke-width: 2.5px; }

.msg-inner { max-width: 82%; display: flex; flex-direction: column; }

.msg-bubble {
  padding: 10px 14px;
  font-size: 13.5px; font-weight: 450; line-height: 1.55;
  word-break: break-word; white-space: pre-wrap;
}
.msg-row.agent .msg-bubble {
  background: rgba(255, 247, 237, 0.65);
  color: #1f2937;
  border: 1px solid rgba(254, 215, 170, 0.45);
  border-radius: 6px 18px 18px 18px;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.02);
}
.msg-row.user .msg-bubble {
  background: linear-gradient(135deg, #F97316 0%, #ea580c 100%);
  color: #fff;
  border-radius: 18px 6px 18px 18px;
  font-weight: 500;
  box-shadow: 0 4px 14px rgba(249, 115, 22, 0.25);
  text-shadow: 0 1px 1px rgba(0,0,0,0.05);
}

.msg-time {
  font-size: 10px; font-weight: 600; color: #9ca3af; margin-top: 5px;
  letter-spacing: .02em;
}
.msg-row.user  .msg-time { text-align: right; padding-right: 4px; }
.msg-row.agent .msg-time { padding-left: 4px; }

/* cursor blink for typing messages */
.cursor-blink {
  display: inline-block;
  width: 2px; height: 13px;
  background: #F97316;
  border-radius: 1px;
  margin-left: 1px;
  vertical-align: middle;
  animation: cursorBlink .85s step-end infinite;
}
@keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }

/* ── Typing indicator ─────────────────────── */
.typing-row {
  display: flex; align-items: flex-start;
  animation: msgIn .2s ease both;
}
.typing-bubble {
  background: rgba(255, 247, 237, 0.65); border: 1px solid rgba(254, 215, 170, 0.45);
  border-radius: 6px 18px 18px 18px;
  padding: 10px 16px;
  display: flex; align-items: center; gap: 5px;
  height: 38px;
}
.typing-dot {
  width: 5.5px; height: 5.5px; border-radius: 50%; background: #fb923c;
  animation: bounce 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: .15s; }
.typing-dot:nth-child(3) { animation-delay: .30s; }
@keyframes bounce {
  0%,80%,100% { transform: translateY(0);  opacity:.5; }
  40%          { transform: translateY(-5.5px); opacity:1; }
}

/* ── Quick actions ───────────────────────── */
.w-quick {
  flex-shrink: 0;
  padding: 12px 18px 0;
  display: flex; gap: 10px;
}
.q-btn {
  flex: 1;
  padding: 10px 12px;
  border: 1.5px solid rgba(249, 115, 22, 0.25);
  border-radius: 99px;
  background: #ffffff;
  color: #ea580c;
  font-family: 'Outfit', sans-serif;
  font-size: 12.5px; font-weight: 700;
  cursor: pointer;
  letter-spacing: -.01em;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.04);
  white-space: nowrap;
}
.q-btn:hover:not(:disabled) {
  background: #fff7ed;
  border-color: #F97316;
  color: #F97316;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.12);
}
.q-btn:active:not(:disabled) { transform: translateY(0); }
.q-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
  border-color: #e5e7eb;
  color: #9ca3af;
}

/* ── Footer / Input ──────────────────────── */
.w-footer {
  flex-shrink: 0;
  padding: 12px 18px 16px;
  background: #ffffff;
  border-top: 1.5px solid rgba(253, 232, 212, 0.3);
}
.w-input-wrap {
  display: flex; align-items: center; gap: 10px;
  background: #fff7ed;
  border: 1.5px solid rgba(254, 215, 170, 0.6);
  border-radius: 16px;
  padding: 8px 8px 8px 16px;
  transition: all 0.25s ease;
}
.w-input-wrap:focus-within {
  border-color: #F97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.08);
  background: #ffffff;
}
.w-input {
  flex: 1; background: transparent; border: none; outline: none;
  font-size: 13.5px; font-weight: 500; color: #1f2937;
  font-family: inherit; line-height: 1.5;
}
.w-input::placeholder { color: rgba(251, 146, 60, 0.6); }

.w-send {
  width: 36px; height: 36px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, #F97316 0%, #ea580c 100%);
  color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
}
.w-send:hover:not(:disabled) {
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
  transform: translateY(-1px) scale(1.04);
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.35);
}
.w-send:active:not(:disabled) { transform: scale(.93); }
.w-send:disabled { background: #e5e7eb; box-shadow: none; cursor: not-allowed; }
.w-send svg { width: 15px; height: 15px; stroke-width: 2.5px; }

.w-branding {
  text-align: center; margin-top: 10px;
  font-size: 11px; font-weight: 600; color: #fdba74;
  letter-spacing: .02em;
}
.w-branding a { color: #F97316; text-decoration: none; font-weight: 700; transition: opacity .15s; }
.w-branding a:hover { opacity: .75; }

/* ── Spinner ─────────────────────────────── */
.w-loader {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 100vh; gap: 12px; background: #fff;
}
.w-spinner {
  width: 22px; height: 22px;
  border: 2.5px solid #fde8d4; border-top-color: #F97316;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.w-loader-txt {
  font-size: 10.5px; font-weight: 700; letter-spacing: .15em;
  text-transform: uppercase; color: #fdba74; font-family: 'Outfit', sans-serif;
}

/* ── Forms ───────────────────────────────── */
.w-form-screen {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #ffffff;
  z-index: 100;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.w-form-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1.5px solid rgba(253, 232, 212, 0.6);
  position: relative;
  height: 65px;
  background: #ffffff;
}
.w-form-header::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #F97316 0%, #fb923c 50%, #fdba74 100%);
}

.w-form-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: radial-gradient(circle at top left, rgba(255,247,237,0.15) 0%, rgba(255,255,255,0) 60%), #ffffff;
}

.w-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.w-label {
  font-family: 'Outfit', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.w-input-field, .w-textarea-field {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid rgba(254, 215, 170, 0.6);
  border-radius: 12px;
  background: rgba(255, 247, 237, 0.4);
  font-family: inherit;
  font-size: 13px;
  color: #1f2937;
  outline: none;
  transition: all 0.2s ease;
}
.w-input-field:focus, .w-textarea-field:focus {
  border-color: #F97316;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.08);
}
.w-textarea-field {
  resize: none;
  height: 100px;
}

.w-form-submit {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #F97316 0%, #ea580c 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-family: 'Outfit', sans-serif;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
  margin-top: 10px;
}
.w-form-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
  transform: translateY(-1.5px);
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.35);
}
.w-form-submit:active:not(:disabled) {
  transform: translateY(0);
}
.w-form-submit:disabled {
  background: #cbd5e1;
  box-shadow: none;
  cursor: not-allowed;
}

.w-success-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
  background: radial-gradient(circle at center, rgba(16,185,129,0.02) 0%, rgba(255,255,255,0) 70%), #ffffff;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.w-success-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #ecfdf5;
  border: 2px solid #a7f3d0;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 6px 16px rgba(16,185,129,0.15);
  animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes scaleIn {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}
.w-success-title {
  font-family: 'Outfit', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 10px;
}
.w-success-text {
  font-size: 13.5px;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 24px;
}

.w-back-btn {
  background: transparent;
  border: none;
  color: #4b5563;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  transition: background .15s, color .15s;
}
.w-back-btn:hover {
  background: #fff7ed;
  color: #F97316;
}
.w-back-btn svg {
  width: 20px;
  height: 20px;
  stroke-width: 2.5px;
}

.w-error-alert {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.5;
}
`;

/* ─────────────────────────────────────────────
   SVG ICONS
───────────────────────────────────────────── */
const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M12 11V7" />
    <circle cx="12" cy="5" r="2" />
    <path d="M8 15h.01M12 15h.01M16 15h.01" strokeWidth="2" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const SuccessTickIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ─────────────────────────────────────────────
   TYPING EFFECT HOOK
   Displays text character-by-character
───────────────────────────────────────────── */
function useTypingText(targetText: string, active: boolean, speedMs = 18) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed(targetText);
      setDone(true);
      return;
    }
    setDisplayed('');
    setDone(false);
    if (!targetText) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(targetText.slice(0, i));
      if (i >= targetText.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speedMs);
    return () => clearInterval(interval);
  }, [targetText, active, speedMs]);

  return { displayed, done };
}

/* ─────────────────────────────────────────────
   SINGLE MESSAGE
───────────────────────────────────────────── */
function ChatMessage({ msg, isLast }: { msg: Message; isLast: boolean }) {
  // Only animate the latest agent message that is still streaming
  const shouldAnimate = msg.role === 'agent' && isLast && msg.isTyping === true;
  const { displayed, done } = useTypingText(msg.text, shouldAnimate, 14);
  const visibleText = shouldAnimate ? displayed : msg.text;

  return (
    <div className={`msg-row ${msg.role}`}>
      {msg.role === 'agent' && (
        <div className="msg-avatar"><BotIcon /></div>
      )}
      <div className="msg-inner">
        <div className="msg-bubble">
          {visibleText}
          {shouldAnimate && !done && <span className="cursor-blink" />}
        </div>
        {msg.time && <div className="msg-time">{msg.time}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN WIDGET
───────────────────────────────────────────── */
function ChatWidgetContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agent');

  const [config, setConfig] = useState<ChatConfig>({
    agentName: 'AgentDesk AI Support',
    welcomeMessage: "Hey 👋\nNeed help with AgentDesk?\nI'm here to answer questions and assist you.",
    primaryColor: '#F97316',
    showBranding: true,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Forms and Actions States
  const [activeForm, setActiveForm] = useState<'ticket' | 'human' | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Inputs States
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [humanMessage, setHumanMessage] = useState('');

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load config
  useEffect(() => {
    const welcome: Message = {
      role: 'agent',
      text: "Hey 👋\nNeed help with AgentDesk?\nI'm here to answer questions and assist you.",
      time: 'Just now',
      isTyping: true,
    };

    if (agentId) {
      fetch(`/api/widget/config?agent=${agentId}`)
        .then(r => r.json())
        .then(data => {
          if (data) {
            const cfg: ChatConfig = {
              agentName: data.agentName || 'AgentDesk AI Support',
              welcomeMessage: data.welcomeMessage || welcome.text,
              primaryColor: data.primaryColor || '#F97316',
              showBranding: data.showBranding !== false,
            };
            setConfig(cfg);
            setMessages([{ ...welcome, text: cfg.welcomeMessage }]);
          }
        })
        .catch(() => setMessages([welcome]));
    } else {
      setMessages([welcome]);
    }
  }, [agentId]);

  const handleSend = useCallback(async (explicitText?: string) => {
    const text = (explicitText ?? input).trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text, time: now(), isTyping: false }]);
    setLoading(true);
    inputRef.current?.focus();

    if (!agentId) {
      // Demo / preview mode — simulate AI response with typing effect
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'agent',
            text: "Thanks for reaching out! This is a live preview — connect an agent ID to enable full AI responses. I'm happy to help with anything AgentDesk-related! 🚀",
            time: now(),
            isTyping: true,
          },
        ]);
        setLoading(false);
      }, 900);
      return;
    }

    try {
      const res = await fetch('/api/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, message: text, conversationId }),
      });

      if (!res.body) throw new Error('no body');

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let aiText = '';

      // Add an empty streaming message
      setMessages(prev => [
        ...prev,
        { role: 'agent', text: '', time: now(), isTyping: true },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const line of dec.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const d = JSON.parse(raw);
            if (d.conversationId) setConversationId(d.conversationId);
            if (d.token) {
              aiText += d.token;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'agent') {
                  return [...prev.slice(0, -1), { ...last, text: aiText }];
                }
                return prev;
              });
            }
          } catch { /* ignore */ }
        }
      }

      // Mark typing done when stream finishes
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'agent') return [...prev.slice(0, -1), { ...last, isTyping: false }];
        return prev;
      });
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'agent', text: 'Connection error — please try again.', time: now(), isTyping: true },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, agentId, conversationId]);

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorEmail || !ticketDescription) {
      setFormError('Email and Description are required.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const history = messages.map(m => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: m.text
      }));

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          sessionId: conversationId || 'widget-' + Date.now(),
          visitorName: visitorName || 'Anonymous',
          visitorEmail: visitorEmail,
          subject: ticketSubject || 'Support request',
          description: ticketDescription,
          conversationHistory: history
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit ticket');
      }
      setFormSubmitted(true);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const submitHumanRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorEmail || !humanMessage) {
      setFormError('Email and Message are required.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/widget/human', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          visitorName: visitorName || 'Anonymous Visitor',
          visitorEmail: visitorEmail,
          message: humanMessage,
          conversationId: conversationId || ''
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send alert');
      }
      setFormSubmitted(true);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setActiveForm(null);
    setFormSubmitted(false);
    setFormLoading(false);
    setFormError('');
    setTicketSubject('');
    setTicketDescription('');
    setHumanMessage('');
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const showTypingDots = loading && messages[messages.length - 1]?.role === 'user';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="w-root">

        {/* ── FORM SCREEN OVERLAY ── */}
        {activeForm !== null && (
          <div className="w-form-screen">
            <header className="w-form-header">
              <button className="w-back-btn" onClick={resetForm} aria-label="Go back">
                <BackIcon />
              </button>
              <div className="w-title">
                {activeForm === 'ticket' ? 'Create a Support Ticket' : 'Talk to Human Support'}
              </div>
            </header>

            {!formSubmitted ? (
              <form className="w-form-body" onSubmit={activeForm === 'ticket' ? submitTicket : submitHumanRequest}>
                {formError && <div className="w-error-alert">{formError}</div>}
                
                <div className="w-field">
                  <label className="w-label">Your Name</label>
                  <input 
                    type="text" 
                    className="w-input-field" 
                    placeholder="Enter your name" 
                    value={visitorName} 
                    onChange={e => setVisitorName(e.target.value)}
                    required
                  />
                </div>

                <div className="w-field">
                  <label className="w-label">Your Email</label>
                  <input 
                    type="email" 
                    className="w-input-field" 
                    placeholder="Enter your email" 
                    value={visitorEmail} 
                    onChange={e => setVisitorEmail(e.target.value)}
                    required
                  />
                </div>

                {activeForm === 'ticket' ? (
                  <>
                    <div className="w-field">
                      <label className="w-label">Subject</label>
                      <input 
                        type="text" 
                        className="w-input-field" 
                        placeholder="What's going on?" 
                        value={ticketSubject} 
                        onChange={e => setTicketSubject(e.target.value)}
                        required
                      />
                    </div>

                    <div className="w-field">
                      <label className="w-label">Description / Details</label>
                      <textarea 
                        className="w-textarea-field" 
                        placeholder="Please describe your issue in detail..." 
                        value={ticketDescription} 
                        onChange={e => setTicketDescription(e.target.value)}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div className="w-field">
                    <label className="w-label">Brief Message</label>
                    <textarea 
                      className="w-textarea-field" 
                      placeholder="What would you like to discuss with our support representative?" 
                      value={humanMessage} 
                      onChange={e => setHumanMessage(e.target.value)}
                      required
                    />
                  </div>
                )}

                <button type="submit" className="w-form-submit" disabled={formLoading}>
                  {formLoading ? 'Submitting...' : activeForm === 'ticket' ? 'Submit Ticket 🎫' : 'Send Request 💬'}
                </button>
              </form>
            ) : (
              <div className="w-success-screen">
                <div className="w-success-icon">
                  <SuccessTickIcon />
                </div>
                <div className="w-success-title">
                  {activeForm === 'ticket' ? 'Ticket Submitted Successfully!' : 'Human Request Transmitted!'}
                </div>
                <p className="w-success-text">
                  {activeForm === 'ticket' 
                    ? `Your ticket has been generated and displayed on our agent dashboard. A confirmation email was sent to ${visitorEmail}.`
                    : `Our support team has been notified, and a representative will follow up at ${visitorEmail} shortly.`}
                </p>
                <button className="w-form-submit" onClick={resetForm}>
                  Return to Chat
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── HEADER ── */}
        <header className="w-header">
          <div className="w-header-left">
            <div className="w-logo"><BotIcon /></div>
            <div>
              <div className="w-title">AgentDesk AI Support</div>
              <div className="w-sub">
                <span className="w-dot" />
                Always online
              </div>
            </div>
          </div>
          <div className="w-actions">
            <button className="w-btn" onClick={() => window.parent.postMessage({ type: 'AGENTDESK_WIDGET_EXPAND' }, '*')} title="Open in new tab">
              <ExternalIcon />
            </button>
            <button className="w-btn" onClick={() => window.parent.postMessage({ type: 'AGENTDESK_WIDGET_CLOSE' }, '*')} title="Close">
              <CloseIcon />
            </button>
          </div>
        </header>

        {/* ── CHAT ── */}
        <main className="w-chat">
          {messages.map((m, i) => (
            <ChatMessage key={i} msg={m} isLast={i === messages.length - 1} />
          ))}

          {showTypingDots && (
            <div className="typing-row">
              <div className="msg-avatar"><BotIcon /></div>
              <div className="typing-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </main>

        {/* ── QUICK ACTIONS ── */}
        <div className="w-quick">
          <button className="q-btn" onClick={() => setActiveForm('ticket')} disabled={loading}>
            🎫 Create a Ticket
          </button>
          <button className="q-btn" onClick={() => setActiveForm('human')} disabled={loading}>
            💬 Talk to Human
          </button>
        </div>

        {/* ── INPUT ── */}
        <footer className="w-footer">
          <div className="w-input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="w-input"
              placeholder="Ask anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={loading}
              autoComplete="off"
            />
            <button className="w-send" onClick={() => handleSend()} disabled={loading || !input.trim()} aria-label="Send">
              <SendIcon />
            </button>
          </div>
          {config.showBranding && (
            <div className="w-branding">
              Powered by AgentDesk
            </div>
          )}
        </footer>

      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────────── */
export default function WidgetChatPage() {
  return (
    <Suspense fallback={
      <div className="w-loader">
        <div className="w-spinner" />
        <div className="w-loader-txt">Loading</div>
      </div>
    }>
      <ChatWidgetContent />
    </Suspense>
  );
}
