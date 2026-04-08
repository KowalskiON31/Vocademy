import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getVocabLists, getVocabList, getEntriesByList, updateEntryLevel } from "../services/vocab";
import confetti from "canvas-confetti";
import logger from "../utils/logger";

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
    .replace(/[.,;:!\?\/\\()\[\]{}"'«»„""‚'`´~^|]/g, ' ')
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
interface Entry { id: number; level: number; field_values: EntryField[] }

export default function VocabTest() {
  const [lists, setLists] = useState<ListItem[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [columnsByList, setColumnsByList] = useState<Record<number, Column[]>>({});
  const [sourceByList, setSourceByList] = useState<Record<number, string>>({});
  const [selectedLevels, setSelectedLevels] = useState<number[]>([1, 2, 3, 4, 5]);

  const [questions, setQuestions] = useState<{
    q: string;
    a: string;
    entryId: number;
    listName: string;
    sourceName: string;
    targetName: string;
    candidates?: string[];
  }[]>([]);
  const [testMode, setTestMode] = useState<'manual' | 'mc'>('manual');
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [userCorrects, setUserCorrects] = useState<boolean[]>([]);

  useEffect(() => {
    logger.info('VOCAB_TEST', 'Komponente geladen');
    const timer = logger.createTimer('VOCAB_TEST', 'Listen laden');
    getVocabLists()
      .then((res) => {
        setLists(res.data || []);
        const duration = timer.end({ count: res.data?.length || 0 });
        logger.success('VOCAB_TEST', `${res.data?.length || 0} Listen geladen in ${duration}ms`);
      })
      .catch((err) => {
        timer.end();
        logger.error('VOCAB_TEST', 'Fehler beim Laden der Listen', err);
      });
  }, []);

  // Spalten je Liste laden, sobald Auswahl sich ändert
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      logger.debug('VOCAB_TEST', `Lade Spalten für ${selected.length} Listen`, { selected });
      const timer = logger.createTimer('VOCAB_TEST', 'Spalten laden');
      const next: Record<number, Column[]> = {};
      for (const id of selected) {
        const res = await getVocabList(id);
        next[id] = res.data.columns || [];
        logger.debug('VOCAB_TEST', `Liste ${id}: ${next[id].length} Spalten`);
      }
      if (!cancelled) {
        setColumnsByList(next);
        timer.end({ listsCount: selected.length });
      }
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
        logger.debug('VOCAB_TEST', `Liste ${id}: Primärspalte = ${primary}`);
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
    const wasSelected = selected.includes(id);
    setSelected((prev) => wasSelected ? prev.filter(x => x !== id) : [...prev, id]);
    logger.userEvent(wasSelected ? 'Liste abgewählt' : 'Liste ausgewählt', { listId: id });
  };

  const start = async () => {
    if (!selected.length) {
      setError("Bitte mindestens eine Liste wählen!");
      logger.warn('VOCAB_TEST', 'Test-Start ohne Listen-Auswahl');
      return;
    }
    if (!selectedLevels.length) {
      setError("Bitte mindestens ein Level wählen!");
      logger.warn('VOCAB_TEST', 'Test-Start ohne Level-Auswahl');
      return;
    }

    logger.userEvent('Test gestartet', {
      lists: selected,
      levels: selectedLevels,
      mode: testMode
    });

    const timer = logger.createTimer('VOCAB_TEST', 'Test vorbereiten');
    setLoading(true);

    try {
      const all: {
        q: string;
        a: string;
        entryId: number;
        listName: string;
        sourceName: string;
        targetName: string;
        candidates?: string[];
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

        logger.debug('VOCAB_TEST', `Liste ${listName}: ${entriesRes.data.length} Einträge geladen`);

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

        // Filter nach ausgewählten Levels
        const allEntries = (entriesRes.data as Entry[]);
        const filteredEntries = allEntries.filter(e => selectedLevels.includes(e.level || 1));

        logger.debug('VOCAB_TEST', `Liste ${listName}: ${filteredEntries.length} Einträge nach Level-Filter`, {
          before: allEntries.length,
          after: filteredEntries.length,
          levels: selectedLevels
        });

        // Kandidaten pro Zielspalte sammeln (einfach: alle Werte dieser Spalte in dieser Liste)
        const candidateMap = new Map<number, Set<string>>();
        for (const e of filteredEntries) {
          for (const fv of e.field_values) {
            const v = (fv.value || '').trim();
            if (!v) continue;
            if (!candidateMap.has(fv.column_id)) candidateMap.set(fv.column_id, new Set());
            candidateMap.get(fv.column_id)!.add(v);
          }
        }

        // Reihenfolge innerhalb der Liste: wir können Einträge mischen, bleiben aber in der Liste
        const entries = filteredEntries.slice();
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
            const pool = Array.from((candidateMap.get(t.id) || new Set<string>())).filter(Boolean);
            all.push({
              q: src,
              a: tgt,
              entryId: e.id,
              listName,
              sourceName: srcColName!,
              targetName: t.name,
              candidates: pool,
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
      setUserCorrects([]);
      setError("");

      const duration = timer.end({ questionsCount: all.length });
      logger.success('VOCAB_TEST', `${all.length} Fragen vorbereitet in ${duration}ms`);
    } catch (err) {
      setError("Fehler beim Laden der Vokabeln");
      timer.end();
      logger.error('VOCAB_TEST', 'Fehler beim Test-Start', err);
    } finally {
      setLoading(false);
    }
  };

  function getChoices(pool: string[] | undefined, correct: string, size = 4) {
    const set = Array.from(new Set((pool || []).filter((p) => p !== correct)));
    logger.debug('VOCAB_TEST', `Multiple Choice: Pool-Größe = ${set.length}`, { poolSize: set.length });

    // shuffle
    for (let i = set.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [set[i], set[j]] = [set[j], set[i]];
    }
    const picks = set.slice(0, Math.max(0, size - 1));
    const choices = [...picks, correct];
    // shuffle final choices
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices;
  }

  const triggerConfetti = () => {
    logger.success('VOCAB_TEST', '🎉 Perfekter Score - Konfetti!');
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const submit = async (givenAnswer?: string) => {
    if (!questions[current]) return;
    const used = typeof givenAnswer !== 'undefined' ? givenAnswer : answer;
    const correct = questions[current].a;
    const entryId = questions[current].entryId;

    // Leere Antwort ist immer falsch
    const isEmpty = !used || used.trim() === '';

    logger.debug('VOCAB_TEST', `Antwort ${current + 1}/${questions.length}`, {
      question: questions[current].q,
      userAnswer: used,
      correctAnswer: correct,
      isEmpty,
      mode: testMode
    });

    // For multiple-choice use strict normalized equality (no fuzzy tolerance)
    const ok = isEmpty ? false : (testMode === 'mc'
      ? normalizeAnswer(used) === normalizeAnswer(correct)
      : isAnswerCorrect(used, correct));

    if (ok) {
      setScore((s) => s + 1);
      logger.success('VOCAB_TEST', `✓ Richtig: ${questions[current].q} → ${used}`);
    } else {
      logger.warn('VOCAB_TEST', `✗ Falsch: ${questions[current].q}`, {
        userAnswer: used,
        correctAnswer: correct
      });
    }

    setUserAnswers((prev) => {
      const next = prev.slice();
      next[current] = used;
      return next;
    });
    setUserCorrects((prev) => {
      const next = prev.slice();
      next[current] = ok;
      return next;
    });

    // Level aktualisieren (asynchron im Hintergrund)
    const levelTimer = logger.createTimer('VOCAB_TEST', 'Level-Update');
    updateEntryLevel(entryId, ok)
      .then(() => {
        levelTimer.end({ entryId, isCorrect: ok });
      })
      .catch(err => {
        levelTimer.end();
        logger.error('VOCAB_TEST', 'Fehler beim Level-Update', { entryId, err });
      });

    // clear local typed answer
    setAnswer("");
    if (current + 1 >= questions.length) {
      setFinished(true);
      const newScore = ok ? score + 1 : score;
      const percentage = Math.round((newScore / questions.length) * 100);

      logger.success('VOCAB_TEST', `Test beendet: ${newScore}/${questions.length} (${percentage}%)`, {
        score: newScore,
        total: questions.length,
        percentage
      });

      // Prüfe ob 100% erreicht
      if (newScore === questions.length) {
        setTimeout(() => triggerConfetti(), 100);
      }
    } else {
      setCurrent((c) => c + 1);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-zinc-950">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400 mb-4"></div>
          <p className="text-lg text-gray-300 font-medium">Vokabeln werden geladen...</p>
        </div>
      </div>
    </div>
  );

  const percentage = questions.length ? Math.round(score / questions.length * 100) : 0;
  const isPerfect = percentage === 100;
  const isExcellent = percentage >= 90;
  const isGood = percentage >= 70;

  if (finished)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-zinc-950">
        <Navbar />
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Ergebnis-Card mit modernem Design */}
          <div className={`relative overflow-hidden rounded-3xl shadow-2xl p-8 animate-slide-up ${
            isPerfect ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500' :
            isExcellent ? 'bg-gradient-to-r from-emerald-400 to-cyan-500' :
            isGood ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
            'bg-gradient-to-r from-slate-500 to-gray-600'
          }`}>
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="text-white">
                  <h2 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                    {isPerfect && <span className="text-5xl animate-bounce">🎉</span>}
                    {isExcellent && !isPerfect && <span className="text-5xl">🌟</span>}
                    {isGood && !isExcellent && <span className="text-5xl">👍</span>}
                    {!isGood && <span className="text-5xl">💪</span>}
                    Test beendet!
                  </h2>
                  <p className="text-white/90 text-base md:text-lg">
                    {isPerfect && "Perfekt! Alle Antworten richtig! 🏆"}
                    {isExcellent && !isPerfect && "Hervorragend! Fast perfekt! ⭐"}
                    {isGood && !isExcellent && "Gut gemacht! Weiter so! 👏"}
                    {!isGood && "Nicht aufgeben! Übung macht den Meister! 💪"}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 text-center min-w-[140px] md:min-w-[180px]">
                  <div className="text-5xl md:text-7xl font-black text-white mb-2">{percentage}%</div>
                  <div className="text-white/90 font-medium text-sm md:text-base">{score} / {questions.length} richtig</div>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={start}
                  className="bg-white text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Test nochmal starten"
                >
                  🔄 Nochmal starten
                </button>
                <button
                  onClick={() => { setFinished(false); setQuestions([]); logger.userEvent('Zurück zur Auswahl'); }}
                  className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Zurück zur Listenauswahl"
                >
                  ← Zurück zur Auswahl
                </button>
              </div>
            </div>

            {/* Dekorative Elemente */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mb-48"></div>
          </div>

          {/* Desktop: Ergebnistabelle */}
          <div className="hidden md:block bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-700/30">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white">📊 Detaillierte Ergebnisse</h3>
            </div>
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50 text-gray-200 font-semibold border-b border-gray-700/30">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Liste</th>
                    <th className="px-4 py-3 text-left">Richtung</th>
                    <th className="px-4 py-3 text-left">Frage</th>
                    <th className="px-4 py-3 text-left">Deine Antwort</th>
                    <th className="px-4 py-3 text-left">Richtig</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((qq, i) => {
                    const ua = (userAnswers[i] || "").trim();
                    const ok = typeof userCorrects[i] !== 'undefined' ? userCorrects[i] : isAnswerCorrect(ua, qq.a);
                    return (
                      <tr key={i} className={`border-b border-gray-700/20 transition-colors ${ok ? 'hover:bg-green-900/20' : 'hover:bg-red-900/20'}`}>
                        <td className="px-4 py-3 font-medium text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{qq.listName}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{qq.sourceName} → {qq.targetName}</td>
                        <td className="px-4 py-3 font-medium text-white">{qq.q}</td>
                        <td className="px-4 py-3 text-gray-200">{ua || <span className="text-gray-500 italic">(keine Antwort)</span>}</td>
                        <td className="px-4 py-3">
                          {ok ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-400/30">
                              ✓ Richtig
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300 border border-red-400/30 mb-1">
                                ✗ Falsch
                              </span>
                              <div className="text-xs text-gray-400 mt-1">Richtig: <span className="font-medium text-green-300">{qq.a}</span></div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Kartenansicht der Ergebnisse */}
          <div className="md:hidden space-y-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl px-6 py-4 shadow-lg">
              <h3 className="text-xl font-bold text-white">📊 Detaillierte Ergebnisse</h3>
            </div>
            {questions.map((qq, i) => {
              const ua = (userAnswers[i] || "").trim();
              const ok = typeof userCorrects[i] !== 'undefined' ? userCorrects[i] : isAnswerCorrect(ua, qq.a);
              return (
                <div key={i} className={`rounded-2xl shadow-lg p-5 border-2 ${
                  ok
                    ? 'bg-green-900/20 border-green-500/30 backdrop-blur-sm'
                    : 'bg-red-900/20 border-red-500/30 backdrop-blur-sm'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-200">#{i + 1}</span>
                    {ok ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/30 text-green-200 border border-green-400/30">
                        ✓ Richtig
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/30 text-red-200 border border-red-400/30">
                        ✗ Falsch
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{qq.listName} • {qq.sourceName} → {qq.targetName}</div>
                  <div className="bg-gray-800/60 rounded-lg p-3 mb-3 shadow-sm backdrop-blur-sm border border-gray-700/30">
                    <div className="text-xs text-gray-400 mb-1">Frage</div>
                    <div className="text-lg font-semibold text-white">{qq.q}</div>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-3 mb-3 shadow-sm backdrop-blur-sm border border-gray-700/30">
                    <div className="text-xs text-gray-400 mb-1">Deine Antwort</div>
                    <div className="text-base font-medium text-white">{ua || <span className="text-gray-500 italic">(keine Antwort)</span>}</div>
                  </div>
                  {!ok && (
                    <div className="bg-gray-800/60 rounded-lg p-3 shadow-sm backdrop-blur-sm border border-gray-700/30">
                      <div className="text-xs text-gray-400 mb-1">Richtige Antwort</div>
                      <div className="text-base font-medium text-green-300">{qq.a}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

  if (!questions.length)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-zinc-950">
        <Navbar />
        <div className="max-w-5xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent mb-3">
              🎯 Vokabeltest
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Wähle deine Listen, Level und Testmodus aus, um mit dem Lernen zu beginnen!
            </p>
          </div>

          {error && (
            <div className="bg-red-900/30 border-2 border-red-500/50 text-red-200 p-4 rounded-2xl text-sm flex items-center gap-2 shadow-lg backdrop-blur-sm">
              <span className="text-2xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Listen auswählen */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/30">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl" aria-hidden="true">📚</span>
              <h2 className="text-xl md:text-2xl font-bold text-white">Listen auswählen</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => toggle(l.id)}
                  className={`px-5 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    selected.includes(l.id)
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                      : "bg-gray-700/40 hover:bg-gray-700/60 text-gray-200 border border-gray-600/30"
                  }`}
                  aria-label={`Liste ${l.name} ${selected.includes(l.id) ? 'abwählen' : 'auswählen'}`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quelle pro Liste */}
          {selected.length > 0 && (
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/30">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl" aria-hidden="true">🌐</span>
                <h2 className="text-xl md:text-2xl font-bold text-white">Quelle pro Liste wählen</h2>
              </div>
              <div className="space-y-4">
                {selected.map((id) => {
                  const cols = columnsByList[id] || [];
                  const listName = (lists.find((l) => l.id === id)?.name) || `Liste ${id}`;
                  return (
                    <div key={id} className="bg-gray-800/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 border border-gray-700/20">
                      <div className="font-semibold text-gray-200 md:w-1/3">{listName}</div>
                      <div className="md:flex-1">
                        <select
                          value={sourceByList[id] || ""}
                          onChange={(e) => {
                            setSourceByList((prev) => ({ ...prev, [id]: e.target.value }));
                            logger.userEvent('Quellspalte geändert', { listId: id, column: e.target.value });
                          }}
                          className="w-full bg-gray-700/60 border-2 border-gray-600/40 text-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                          aria-label={`Quellspalte für Liste ${listName} auswählen`}
                        >
                          <option value="" disabled>Quelle wählen...</option>
                          {cols.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>Ziel ist automatisch „alle anderen Sprachen" der jeweils ausgewählten Liste.</span>
                </p>
              </div>
            </div>
          )}

          {/* Level auswählen */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/30">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl" aria-hidden="true">📊</span>
              <h2 className="text-xl md:text-2xl font-bold text-white">Level wählen</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Wähle die Schwierigkeitsstufen aus (Level 1 = neu/schwierig, Level 5 = gut gelernt)
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((level) => {
                const levelEmojis = ['🔴', '🟠', '🟡', '🟢', '🟦'];
                const levelColors = [
                  'from-red-400 to-red-600',
                  'from-orange-400 to-orange-600',
                  'from-yellow-400 to-yellow-600',
                  'from-green-400 to-green-600',
                  'from-blue-400 to-blue-600'
                ];
                return (
                  <button
                    key={level}
                    onClick={() => {
                      setSelectedLevels((prev) =>
                        prev.includes(level)
                          ? prev.filter(l => l !== level)
                          : [...prev, level].sort()
                      );
                      logger.userEvent(selectedLevels.includes(level) ? 'Level abgewählt' : 'Level ausgewählt', { level });
                    }}
                    className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      selectedLevels.includes(level)
                        ? `bg-gradient-to-r ${levelColors[level - 1]} text-white shadow-lg`
                        : "bg-gray-700/40 hover:bg-gray-700/60 text-gray-200 border border-gray-600/30"
                    }`}
                    aria-label={`Level ${level} ${selectedLevels.includes(level) ? 'abwählen' : 'auswählen'}`}
                  >
                    <span aria-hidden="true">{levelEmojis[level - 1]}</span> Level {level}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                setSelectedLevels([1, 2, 3, 4, 5]);
                logger.userEvent('Alle Levels ausgewählt');
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-600/20 hover:from-indigo-500/30 hover:to-purple-600/30 text-indigo-300 font-semibold transition-all border border-indigo-400/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Alle Levels auswählen"
            >
              ✨ Alle auswählen
            </button>
          </div>

          {/* Modus wählen */}
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-700/30">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl" aria-hidden="true">🎮</span>
              <h2 className="text-xl md:text-2xl font-bold text-white">Testmodus wählen</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setTestMode('manual');
                  logger.userEvent('Testmodus geändert', { mode: 'manual' });
                }}
                className={`p-6 rounded-2xl font-semibold transition-all transform hover:scale-105 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  testMode === 'manual'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'bg-gray-700/40 hover:bg-gray-700/60 text-gray-200 border border-gray-600/30'
                }`}
                aria-label="Manuellen Testmodus wählen"
              >
                <div className="text-3xl mb-2" aria-hidden="true">⌨️</div>
                <div className="text-xl font-bold mb-1">Manuell</div>
                <div className={`text-sm ${testMode === 'manual' ? 'text-white/80' : 'text-gray-400'}`}>
                  Gib die Antwort selbst ein
                </div>
              </button>
              <button
                onClick={() => {
                  setTestMode('mc');
                  logger.userEvent('Testmodus geändert', { mode: 'mc' });
                }}
                className={`p-6 rounded-2xl font-semibold transition-all transform hover:scale-105 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  testMode === 'mc'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-700/40 hover:bg-gray-700/60 text-gray-200 border border-gray-600/30'
                }`}
                aria-label="Multiple-Choice Testmodus wählen"
              >
                <div className="text-3xl mb-2" aria-hidden="true">🎲</div>
                <div className="text-xl font-bold mb-1">Multiple Choice</div>
                <div className={`text-sm ${testMode === 'mc' ? 'text-white/80' : 'text-gray-400'}`}>
                  Wähle aus 4 Antworten
                </div>
              </button>
            </div>
          </div>

          {/* Start Button */}
          <div className="flex justify-center">
            <button
              onClick={start}
              className="group relative px-12 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xl font-bold shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-950"
              aria-label="Test starten"
            >
              <span className="relative z-10 flex items-center gap-3">
                🚀 Test starten
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            </button>
          </div>
        </div>
      </div>
    );

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-zinc-950">
      <Navbar />

      {/* Progress Bar */}
      <div className="sticky top-16 z-20 bg-gray-800/80 backdrop-blur-md border-b border-gray-700/50 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-200">
              Frage {current + 1} von {questions.length}
            </span>
            <span className="text-sm font-semibold text-indigo-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 py-12">
        {/* Fragen-Card */}
        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-700/30 animate-slide-up">
          {/* Liste & Richtung Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-700/30">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg font-semibold border border-indigo-400/30">
                📚 {q.listName}
              </span>
            </div>
            <div className="text-sm text-gray-300">
              <span className="font-medium">{q.sourceName}</span>
              <span className="mx-2">→</span>
              <span className="font-medium">{q.targetName}</span>
            </div>
          </div>

          {/* Frage */}
          <div className="mb-8 text-center">
            <div className="text-sm text-gray-400 mb-3 uppercase tracking-wider font-semibold">Übersetze</div>
            <div className="text-3xl md:text-5xl font-black text-white leading-tight">
              {q.q}
            </div>
          </div>

          {/* Antwort-Bereich */}
          {testMode === 'manual' ? (
            <div className="space-y-4">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="w-full bg-gray-700/60 border-2 border-gray-600/40 text-white rounded-2xl px-6 py-5 text-2xl text-center focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/50 outline-none transition-all placeholder-gray-400"
                placeholder="Gib deine Antwort ein..."
                autoFocus
                aria-label="Antwort eingeben"
              />
              <button
                onClick={() => submit()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xl font-bold px-8 py-5 rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Antwort bestätigen"
              >
                Bestätigen ✓
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getChoices(q.candidates, q.a, 4).map((choice, idx) => {
                const colors = [
                  'hover:border-blue-400/50 hover:bg-blue-500/10',
                  'hover:border-green-400/50 hover:bg-green-500/10',
                  'hover:border-purple-400/50 hover:bg-purple-500/10',
                  'hover:border-orange-400/50 hover:bg-orange-500/10'
                ];
                return (
                  <button
                    key={idx}
                    onClick={() => submit(choice)}
                    className={`bg-gray-700/40 border-2 border-gray-600/40 text-gray-200 rounded-2xl px-6 py-5 text-lg font-semibold text-left transition-all transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${colors[idx]}`}
                    aria-label={`Option ${String.fromCharCode(65 + idx)}: ${choice}`}
                  >
                    <div className="text-xs text-gray-400 mb-1">Option {String.fromCharCode(65 + idx)}</div>
                    <div className="text-white">{choice}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Hilfe-Text */}
        <div className="mt-6 text-center text-sm text-gray-400">
          {testMode === 'manual' ? '⌨️ Drücke Enter zum Bestätigen' : '🎯 Wähle die richtige Antwort aus'}
        </div>
      </div>
    </div>
  );
}
