import { useEffect, useRef, useState, type FormEvent } from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { respond } from '../core/assistant';
import { validateText } from '../core/validation';
import { CategoryBadge, EmptyState, ErrorBanner, PageHeader } from '../components/ui';
import { useAppData } from '../state/AppContext';
import type { AssistantResult, ChatMessage } from '../types';

const EXAMPLES = [
  { text: 'How do I prepare ORS?', note: 'ANSWER' },
  { text: 'How much antibiotic should I give?', note: 'REFUSE' },
  { text: 'I am bleeding in my third trimester.', note: 'REFER NOW' },
];

function ResultCard({ result }: { result: AssistantResult }) {
  const urgent = result.category === 'REFER_NOW';
  const frame = {
    ANSWER: 'border-brand-600 bg-white',
    REFUSE: 'border-saffron-500 bg-saffron-100/40',
    REFER_NOW: 'border-alert-600 bg-alert-50 border-4',
  }[result.category];
  return (
    <div className={`rounded-lg border-2 p-4 ${frame}`} role={urgent ? 'alert' : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={result.category} />
        <span className={`font-bold ${urgent ? 'text-lg text-alert-700' : ''}`}>{result.message}</span>
      </div>
      {result.matchedRules.length > 0 && (
        <p className="mt-2 text-sm font-semibold text-alert-700">
          Matched demo rule(s): {result.matchedRules.map((r) => `${r.label} [${r.id}]`).join('; ')}
        </p>
      )}
      {result.details.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {result.details.map((line) => <li key={line}>{line}</li>)}
        </ul>
      )}
      {result.sources.map((s) => (
        <p key={`${s.document}-${s.section}`} className="mt-2 rounded bg-slate-100 p-2 text-xs text-slate-800">
          <strong>Source:</strong> {s.document} → {s.section}<br />
          <strong>Status:</strong> {s.reviewStatus}
        </p>
      ))}
      <p className="mt-2 text-xs text-slate-600">
        Safety rules {result.dangerCheckMs.toFixed(2)} ms · total {result.totalMs.toFixed(2)} ms (measured on this device)
      </p>
    </div>
  );
}

export function Assistant() {
  const { chat, appendChat, clearChat } = useAppData();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [chat.length]);

  const ask = async (question: string) => {
    const problem = validateText(question, APP_CONFIG.limits.chatChars, 'Question');
    if (problem) { setError(problem); return; }
    const now = new Date().toISOString();
    // Safety rules run inside respond() before anything else, so a danger sign always wins.
    const result = respond(question);
    const messages: ChatMessage[] = [
      { id: crypto.randomUUID(), role: 'user', text: question.trim(), createdAt: now },
      { id: crypto.randomUUID(), role: 'assistant', text: result.message, createdAt: new Date(Date.parse(now) + 1).toISOString(), result },
    ];
    try {
      await appendChat(messages);
      setError(null);
      setInput('');
    } catch {
      setError('Could not save this chat to local storage. The answer is shown below only until you leave this page.');
    }
  };

  const submit = (e: FormEvent) => { e.preventDefault(); void ask(input); };

  return (
    <>
      <PageHeader title="AI Health Assistant" subtitle="English responses and safety guidance. Runs fully on this device." />
      <div className="mb-4 rounded-md border border-saffron-500 bg-saffron-100 p-3 text-sm text-saffron-700" role="note">
        <strong>Demonstration only.</strong> Danger-sign rules and protocol text are demo content, not reviewed against official medical guidelines. No language model is running: answers are extracted from the local protocol library.
      </div>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <div className="mb-3 flex flex-wrap gap-2" aria-label="Example questions">
        {EXAMPLES.map((ex) => (
          <button key={ex.text} className="btn-secondary !justify-start text-left" onClick={() => void ask(ex.text)}>
            {ex.text} <span className="ml-2 rounded bg-brand-100 px-1.5 text-xs">{ex.note}</span>
          </button>
        ))}
      </div>

      <div className="card min-h-[260px] space-y-4" aria-live="polite">
        {chat.length === 0 && <EmptyState title="No questions yet" hint="Try one of the example questions above." />}
        {chat.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="ml-auto max-w-[85%] rounded-lg bg-brand-700 p-3 text-sm text-white">{m.text}</div>
          ) : m.result ? (
            <ResultCard key={m.id} result={m.result} />
          ) : null,
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="question">Your question</label>
        <input id="question" className="field" value={input} maxLength={APP_CONFIG.limits.chatChars}
          placeholder="Type a question, e.g. How do I prepare ORS?" onChange={(e) => setInput(e.target.value)} />
        <button className="btn-primary" type="submit">Ask</button>
      </form>
      {chat.length > 0 && (
        <button className="mt-3 text-sm font-semibold text-slate-700 underline" onClick={() => void clearChat()}>Clear chat history</button>
      )}
    </>
  );
}
