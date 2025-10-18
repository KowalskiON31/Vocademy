// src/pages/VocabTest.tsx
import { useEffect, useState } from "react";
import {
  getVocabLists,
  getEntriesByList,
} from "../services/vocab";

interface VocabList {
  id: number;
  name: string;
}

interface Entry {
  id: number;
  term: string;
  source_language: string;
  translations: { language: string; text: string }[];
}

export default function VocabTest() {
  const [lists, setLists] = useState<VocabList[]>([]);
  const [selectedLists, setSelectedLists] = useState<number[]>([]);
  const [, setEntries] = useState<Entry[]>([]);
  const [mode, setMode] = useState<"1" | "2" | "3">("3");
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  // Listen laden
  useEffect(() => {
    getVocabLists()
      .then((res: any) => setLists(res.data))
      .catch(() => {});
  }, []);

  const toggleList = (id: number) => {
    setSelectedLists((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const startTest = async () => {
    if (selectedLists.length === 0) return;
    setLoading(true);
    try {
      let allEntries: Entry[] = [];
      for (const listId of selectedLists) {
        const res = await getEntriesByList(listId);
        allEntries = [...allEntries, ...res.data];
      }

      // Fragen generieren
      const q: any[] = [];
      allEntries.forEach((e) => {
        e.translations?.forEach((t) => {
          q.push({
            term: e.term,
            trans: t.text,
            source: e.source_language,
            target: t.language,
          });
        });
      });
      shuffle(q);
      setEntries(allEntries);
      setQuestions(q);
      setFinished(false);
      setScore(0);
      setCurrent(0);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const shuffle = (arr: any[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  const handleSubmit = () => {
    if (!questions[current]) return;
    const q = questions[current];
    const direction =
      mode === "3" ? (Math.random() < 0.5 ? "1" : "2") : mode;

    const correct =
      direction === "1" ? q.trans.toLowerCase() : q.term.toLowerCase();
    if (answer.trim().toLowerCase() === correct) {
      setScore((s) => s + 1);
    } else {
      // keep silent in legacy page
    }
    setAnswer("");
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  if (loading) return <div className="p-8">Ladenâ€¦</div>;

  if (finished)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">ðŸŽ¯ Test beendet!</h2>
          <p className="text-lg mb-2">
            {score} von {questions.length} richtig
          </p>
          <p className="text-gray-500 mb-6">
            ({Math.round((score / questions.length) * 100)}%)
          </p>
          <button
            onClick={startTest}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Nochmal starten
          </button>
        </div>
      </div>
    );

  if (questions.length === 0)
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">ðŸ§  Vokabeltest</h1>

          <h2 className="font-semibold mb-2">WÃ¤hle deine Listen:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {lists.map((l) => (
              <button
                key={l.id}
                onClick={() => toggleList(l.id)}
                className={`border rounded px-3 py-2 ${
                  selectedLists.includes(l.id)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>

          <h2 className="font-semibold mb-2">Richtung:</h2>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "1" | "2" | "3")}
            className="border rounded px-3 py-2 mb-4"
          >
            <option value="1">Quelle â†’ Ziel</option>
            <option value="2">Ziel â†’ Quelle</option>
            <option value="3">ZufÃ¤llig</option>
          </select>

          <button
            onClick={startTest}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Test starten
          </button>
        </div>
      </div>
    );

  // Aktuelle Frage
  const q = questions[current];
  const direction = mode === "3" ? (Math.random() < 0.5 ? "1" : "2") : mode;
  const questionText =
    direction === "1"
      ? `${q.term} (${q.source} â†’ ${q.target})`
      : `${q.trans} (${q.target} â†’ ${q.source})`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 text-center">
        <h2 className="text-xl font-bold mb-4">
          Frage {current + 1}/{questions.length}
        </h2>
        <p className="text-lg mb-4">{questionText}</p>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Antwort eingeben..."
          className="border rounded px-3 py-2 w-full mb-4"
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
        >
          BestÃ¤tigen
        </button>
      </div>
    </div>
  );
}

