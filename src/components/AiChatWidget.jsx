import { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Send, Sparkles, X, Languages } from 'lucide-react';
import { assistantService } from '../services/assistantService';
import { useTranslation } from '../hooks/useTranslation';
import { ASSISTANT_REPLY_LANGUAGES, AI_CHAT_LANGUAGE_KEY } from '../constants/assistantLanguages';

function readStoredReplyLanguage() {
  try {
    const raw = localStorage.getItem(AI_CHAT_LANGUAGE_KEY);
    if (raw && ASSISTANT_REPLY_LANGUAGES.some((x) => x.code === raw)) return raw;
  } catch {
    /* ignore */
  }
  return 'auto';
}

const AiChatWidget = () => {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(null);
  const [replyLanguage, setReplyLanguage] = useState(readStoredReplyLanguage);
  const [messages, setMessages] = useState(() => [{ role: 'assistant', content: t('ai.intro') }]);

  useEffect(() => {
    try {
      localStorage.setItem(AI_CHAT_LANGUAGE_KEY, replyLanguage);
    } catch {
      /* ignore */
    }
  }, [replyLanguage]);

  const quickPrompts = useMemo(() => [t('ai.quick1'), t('ai.quick2'), t('ai.quick3')], [t]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: t('ai.intro') }];
      }
      return prev;
    });
  }, [locale, t]);

  const sendMessage = async (text) => {
    const message = text.trim();
    if (!message || loading) return;

    const historyPayload = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setLoading(true);

    try {
      const result = await assistantService.chat(message, historyPayload, { language: replyLanguage });
      if (result.meta && typeof result.meta.aiEnabled === 'boolean') {
        setAiEnabled(result.meta.aiEnabled);
      }
      let answer = result.answer || t('ai.noAnswer');
      if (import.meta.env.DEV && result.meta?.aiLlmError) {
        answer += `\n\n— debug —\n${String(result.meta.aiLlmError).slice(0, 1200)}`;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: t('ai.apiError') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[90]">
      {open && (
        <div className="mb-3 w-[22rem] sm:w-[26rem] rounded-2xl border border-white/70 bg-white/95 shadow-2xl shadow-slate-950/30 backdrop-blur-md overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles size={16} />
              {t('ai.title')}
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/20" aria-label={t('common.close')}>
              <X size={16} />
            </button>
          </div>
          {aiEnabled === false && (
            <div className="px-3 py-2 text-xs bg-amber-50 text-amber-900 border-b border-amber-100">
              {t('ai.llmHint')}
            </div>
          )}

          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
            <Languages size={16} className="text-slate-500 shrink-0" aria-hidden />
            <label className="sr-only" htmlFor="ai-reply-language">
              {t('ai.replyLanguage')}
            </label>
            <select
              id="ai-reply-language"
              value={replyLanguage}
              onChange={(e) => setReplyLanguage(e.target.value)}
              disabled={loading}
              className="flex-1 min-w-0 text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {ASSISTANT_REPLY_LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code}>
                  {code === 'auto' ? t('ai.langAuto') : label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 space-y-2 h-80 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-xl px-3 py-2 text-sm whitespace-pre-line ${
                  message.role === 'user'
                    ? 'bg-emerald-500 text-white ml-8'
                    : 'bg-slate-100 text-slate-800 mr-8'
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="rounded-xl px-3 py-2 text-sm bg-slate-100 text-slate-600 mr-8">
                {t('ai.analyzing')}
              </div>
            )}
          </div>

          <div className="px-3 pb-2 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs rounded-full border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-slate-200 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholderShort')}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendMessage(input);
                }
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="h-10 w-10 rounded-xl bg-emerald-500 text-white grid place-items-center disabled:opacity-50"
              aria-label={t('ai.send')}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className="h-14 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-900/30 grid place-items-center"
        aria-label={t('ai.openAria')}
      >
        <MessageCircle size={22} />
      </button>
    </div>
  );
};

export default AiChatWidget;
