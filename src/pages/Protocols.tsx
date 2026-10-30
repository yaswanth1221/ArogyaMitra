import { useState } from 'react';
import { DANGER_RULES } from '../core/dangerSigns';
import { searchProtocols } from '../core/retrieval';
import { PROTOCOL_SECTIONS } from '../data/protocols';
import { DemoBadge, EmptyState, PageHeader } from '../components/ui';

export function Protocols() {
  const [query, setQuery] = useState('');
  const hits = query.trim() === '' ? null : searchProtocols(query, PROTOCOL_SECTIONS);
  const documents = [...new Set(PROTOCOL_SECTIONS.map((s) => s.document))];

  return (
    <>
      <PageHeader title="Protocol Library" subtitle="Local search over the protocol dataset used by the assistant." action={<DemoBadge>DEMO protocols</DemoBadge>} />
      <div className="mb-4 rounded-md border border-saffron-500 bg-saffron-100 p-3 text-sm text-saffron-700" role="note">
        This dataset is demonstration content, not official guidance. To use approved documents, replace the entries in <code>src/data/protocols.ts</code> with sections extracted from them (see README, “Replacing the demo protocols”).
      </div>
      <label><span className="label">Search protocols</span>
        <input className="field" placeholder="e.g. ORS, newborn, hand washing" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {hits && (
        <div className="card mt-3">
          <h2 className="font-semibold">Search results</h2>
          {hits.length === 0 ? <EmptyState title="No matching section" hint="The assistant would refuse a question like this." /> : (
            <ul className="mt-2 text-sm">{hits.map((h) => <li key={h.section.id}>{h.section.title} <span className="text-slate-600">(score {h.score}; matched: {h.matchedTerms.join(', ')})</span></li>)}</ul>
          )}
        </div>
      )}

      {documents.map((doc) => (
        <section key={doc} className="card mt-4">
          <h2 className="font-display text-lg font-bold text-brand-900">{doc}</h2>
          {PROTOCOL_SECTIONS.filter((s) => s.document === doc).map((s) => (
            <article key={s.id} className="mt-3 border-t border-slate-200 pt-3 text-sm">
              <h3 className="font-semibold">{s.title}</h3>
              <ul className="mt-1 list-disc pl-5">{s.body.map((l) => <li key={l}>{l}</li>)}</ul>
              <p className="mt-1 text-xs text-slate-600">{s.reviewStatus}</p>
            </article>
          ))}
        </section>
      ))}

      <section className="card mt-4">
        <h2 className="font-display text-lg font-bold text-brand-900">Danger-sign rules (DEMO)</h2>
        <p className="text-sm text-slate-700">A rule fires when every keyword group has a match. Rules do not understand negation and are not clinically reviewed.</p>
        <ul className="mt-2 divide-y divide-slate-200 text-sm">
          {DANGER_RULES.map((r) => <li key={r.id} className="py-2"><strong>{r.id}</strong> · {r.label}<br /><span className="text-xs text-slate-600">{r.groups.map((g) => `[${g.join(' | ')}]`).join(' AND ')}</span></li>)}
        </ul>
      </section>
    </>
  );
}
