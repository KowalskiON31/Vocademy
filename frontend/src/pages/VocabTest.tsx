import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getVocabLists, getVocabList, getEntriesByList } from "../services/vocab";

// Toleranter Antwortvergleich: normalisiert Zeichen, Leerzeichen, Interpunktion
function normalizeAnswer(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize('NFKD')
    // Diakritika entfernen (z. B. ä -> a)
    .replace(/[\u0300-\u036f]/g, '')
    // ß vereinheitlichen
    .replace(/ß/g, 'ss')
    // Verschiedene Anführungszeichen angleichen
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035\u00B4]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    // Interpunktion und Klammern durch Leerzeichen ersetzen (damit Wörter nicht zusammenkleben)
    .replace(/[.,;:!\?\/\\()\[\]{}"'«»„“”‚’`´~^|]/g, ' ')
    .replace(/[-–—_]/g, ' ')
    // Mehrfache Whitespaces reduzieren
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const n = a.length, m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;
  const dp = new Array(m + 1);
  for (let j = 0; j <= m; j++) dp[j] = j;
  for (let i = 1; i <= n; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= m; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(
        dp[j] + 1,         // Löschung
        dp[j - 1] + 1,     // Einfügung
        prev + cost        // Ersetzung
      );
      prev = temp;
    }
  }
  return dp[m];
}

function isAnswerCorrect(userInput: string, correctAnswer: string): boolean {
  const ua = normalizeAnswer(userInput);
  const ca = normalizeAnswer(correctAnswer);
  if (ua === ca) return true;
  // Kleine Tippfehler tolerieren (ca. 10% der Länge, mindestens 1)
  const maxLen = Math.max(ua.length, ca.length);
  const allowed = Math.max(1, Math.floor(maxLen * 0.1));
  return levenshtein(ua, ca) <= allowed;
}

interface ListItem { id: number; name: string }
interface Column { id: number; name: string; is_primary?: boolean }
interface EntryField { column_id: number; value: string }
interface Entry { id: number; field_values: EntryField[] }

export default function VocabTest() {
  const [lists, setLists] = useState<ListItem[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [columnsByList, setColumnsByList] = useState<Record<number, Column[]>>({});
  const [sourceByList, setSourceByList] = useState<Record<number, string>>({});

  const [questions, setQuestions] = useState<{
    q: string;
    a: string;
    listName: string;
    sourceName: string;
    targetName: string;
  }[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userAnswers, setUserAnswers] = useState<string[]>([]);

  useEffect(() => {
    getVocabLists().then((res) => setLists(res.data || [])).catch(() => {});
  }, []);

  // Spalten je Liste laden, sobald Auswahl sich ändert
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const next: Record<number, Column[]> = {};
      for (const id of selected) {
        const res = await getVocabList(id);
        next[id] = res.data.columns || [];
      }
      if (!cancelled) setColumnsByList(next);
    };
    if (selected.length) load(); else setColumnsByList({});
    return () => { cancelled = true; };
  }, [selected]);

  // Standard-Quellspalte je Liste (Primärspalte oder erste Spalte)
  useEffect(() => {
    const next: Record<number, string> = { ...sourceByList };
    for (const id of selected) {
      const cols = columnsByList[id] || [];
      if (!cols.length) continue;
      if (!next[id]) {
        const primary = cols.find((c) => c.is_primary)?.name || cols[0].name;
        next[id] = primary;
      }
    }
    // Entferne abgewählte Listen
    Object.keys(next).forEach((k) => {
      const id = Number(k);
      if (!selected.includes(id)) delete next[id];
    });
    setSourceByList(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, columnsByList]);

  const toggle = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const start = async () => {
    if (!selected.length) { setError("Bitte mindestens eine Liste wählen!"); return; }
    setLoading(true);
    try {
      const all: {
        q: string;
        a: string;
        listName: string;
        sourceName: string;
        targetName: string;
      }[] = [];

      // Liste für Liste abfragen (keine globale Durchmischung der Listen)
      for (const listId of selected) {
        const [listRes, entriesRes] = await Promise.all([
          getVocabList(listId),
          getEntriesByList(listId),
        ]);
        const listName: string = listRes.data.name;
        const columns = listRes.data.columns as Column[];
        const nameToId = new Map(columns.map((c) => [c.name, c.id] as const));

        // Quelle je Liste: gewählte Spalte für diese Liste, sonst Primärspalte
        let srcColName = sourceByList[listId];
        let srcId = nameToId.get(srcColName);
        if (!srcId) {
          const primary = columns.find((c) => c.is_primary);
          if (!primary) continue;
          srcId = primary.id;
          srcColName = primary.name;
        }

        // Zielkandidaten: alle anderen Spalten in dieser Liste (außer Quelle)
        const targets = columns.filter((c) => c.id !== srcId);

        // Reihenfolge innerhalb der Liste: wir können Einträge mischen, bleiben aber in der Liste
        const entries = (entriesRes.data as Entry[]).slice();
        for (let i = entries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [entries[i], entries[j]] = [entries[j], entries[i]];
        }

        for (const e of entries) {
          const map = new Map(e.field_values.map((f) => [f.column_id, f.value] as const));
          const src = (map.get(srcId) || "").trim();
          if (!src) continue;

          // Ziele pro Eintrag in zufälliger Reihenfolge
          const shuffledTargets = targets.slice();
          for (let i = shuffledTargets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledTargets[i], shuffledTargets[j]] = [shuffledTargets[j], shuffledTargets[i]];
          }

          for (const t of shuffledTargets) {
            const tgt = (map.get(t.id) || "").trim();
            if (!tgt) continue;
            all.push({
              q: src,
              a: tgt,
              listName,
              sourceName: srcColName!,
              targetName: t.name,
            });
          }
        }
      }
      // Globales Mischen aller gesammelten Fragen (Fisher-Yates)
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      setQuestions(all);
      setCurrent(0);
      setAnswer("");
      setScore(0);
      setFinished(false);
      setUserAnswers([]);
      setError("");
    } catch {
      setError("Fehler beim Laden der Vokabeln");
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    if (!questions[current]) return;
    const correct = questions[current].a;
    const ok = isAnswerCorrect(answer, correct);
    if (ok) setScore((s) => s + 1);
    setUserAnswers((prev) => {
      const next = prev.slice();
      next[current] = answer;
      return next;
    });
    setAnswer("");
    if (current + 1 >= questions.length) setFinished(true);
    else setCurrent((c) => c + 1);
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="max-w-4xl mx-auto p-6">Laden...</div></div>;

  if (finished)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto p-6 space-y-4">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold mb-2">Test beendet</h2>
            <p className="mb-1">{score} von {questions.length} richtig</p>
            <p className="text-gray-500 mb-4">{questions.length ? Math.round(score / questions.length * 100) : 0}%</p>
            <button onClick={start} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">Nochmal starten</button>
          </div>

          {/* Desktop: Ergebnistabelle */}
          <div className="hidden md:block bg-white rounded-xl shadow overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Liste</th>
                  <th className="px-3 py-2 text-left">Richtung</th>
                  <th className="px-3 py-2 text-left">Frage</th>
                  <th className="px-3 py-2 text-left">Deine Antwort</th>
                  <th className="px-3 py-2 text-left">Richtig</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((qq, i) => {
                  const ua = (userAnswers[i] || "").trim();
                  const ok = isAnswerCorrect(ua, qq.a);
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{qq.listName}</td>
                      <td className="px-3 py-2">{qq.sourceName} → {qq.targetName}</td>
                      <td className="px-3 py-2">{qq.q}</td>
                      <td className="px-3 py-2">{ua || <span className="text-gray-400">(leer)</span>}</td>
                      <td className="px-3 py-2">{ok ? <span className="text-green-700">✔</span> : <span className="text-red-700">✘ ({qq.a})</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: Kartenansicht der Ergebnisse */}
          <div className="md:hidden space-y-3">
            {questions.map((qq, i) => {
              const ua = (userAnswers[i] || "").trim();
              const ok = isAnswerCorrect(ua, qq.a);
              return (
                <div key={i} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>#{i + 1}</span>
                    <span>{qq.listName}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-700">{qq.sourceName} → {qq.targetName}</div>
                  <div className="mt-2 text-lg font-semibold">{qq.q}</div>
                  <div className="mt-2 text-sm">
                    <div className="text-gray-500">Deine Antwort</div>
                    <div>{ua || <span className="text-gray-400">(leer)</span>}</div>
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="text-gray-500">Richtig</div>
                    <div className={ok ? "text-green-700" : "text-red-700"}>{ok ? "✔" : `✘ (${qq.a})`}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

  if (!questions.length)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <h1 className="text-2xl font-bold">Vokabeltest</h1>
          {error && (
            <div className="bg-red-100 text-red-700 border border-red-400 p-2 rounded text-sm">{error}</div>
          )}
          <p className="text-gray-600">Fragen werden über alle ausgewählten Listen global gemischt. Quelle ist deine Auswahl; fehlt sie in einer Liste, wird deren Primärspalte verwendet.</p>
          <div>
            <h2 className="font-semibold mb-2">Listen auswählen</h2>
            <div className="flex flex-wrap gap-2">
              {lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => toggle(l.id)}
                  className={`px-3 py-2 rounded border ${selected.includes(l.id) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-gray-50"}`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold">Quelle pro Liste wählen</h2>
            {selected.map((id) => {
              const cols = columnsByList[id] || [];
              const listName = (lists.find((l) => l.id === id)?.name) || `Liste ${id}`;
              return (
                <div key={id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="text-sm text-gray-700">{listName}</div>
                  <div className="md:col-span-2">
                    <select
                      value={sourceByList[id] || ""}
                      onChange={(e) => setSourceByList((prev) => ({ ...prev, [id]: e.target.value }))}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="" disabled>Quelle wählen</option>
                      {cols.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-gray-500">Ziel ist automatisch „alle anderen Sprachen“ der jeweils ausgewählten Liste.</p>
          </div>

          <div>
            <button onClick={start} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">Test starten</button>
          </div>
        </div>
      </div>
    );

  const q = questions[current];
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Frage {current + 1}/{questions.length}</span>
            <span>Liste: {q.listName}</span>
          </div>
          <div className="text-sm text-gray-700">Quelle: <span className="font-medium">{q.sourceName}</span> → Ziel: <span className="font-medium">{q.targetName}</span></div>
          <div className="text-2xl font-semibold text-center">{q.q}</div>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="border rounded w-full px-3 py-2"
            placeholder="Antwort eingeben..."
          />
          <button onClick={submit} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 w-full">Bestätigen</button>
        </div>
      </div>
    </div>
  );
}
