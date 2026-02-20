import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, push, onValue } from 'firebase/database';

function App() {
  // --- UMUMIY STATE-LAR ---
  const [isAdmin, setIsAdmin] = useState(false); // Admin yoki O'quvchi rejimi
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState('7A');
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [questionsFromDB, setQuestionsFromDB] = useState({});

  // --- O'QUVCHI TEST STATE-LARI ---
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentInput, setStudentInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [status, setStatus] = useState(null);

  // --- O'QITUVCHI PANEL STATE-LARI ---
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswer, setNewQuestionAnswer] = useState('');
  const [targetClass, setTargetClass] = useState('7A');
  const [results, setResults] = useState([]);

  // --- BAZADAN MA'LUMOTLARNI OLISH ---
  useEffect(() => {
    // Savollarni olish
    onValue(ref(db, 'questions'), (snapshot) => {
      if (snapshot.exists()) setQuestionsFromDB(snapshot.val());
    });
    // Natijalarni olish
    onValue(ref(db, 'results'), (snapshot) => {
      if (snapshot.exists()) setResults(Object.values(snapshot.val()));
    });
  }, []);

  // --- O'QITUVCHI FUNKSIYALARI ---
  const addQuestion = () => {
    if (!newQuestionText || !newQuestionAnswer) return alert("To'ldiring!");
    push(ref(db, `questions/${targetClass}`), {
      text: newQuestionText,
      answer: newQuestionAnswer,
      id: Date.now()
    }).then(() => {
      alert("Savol qo'shildi!");
      setNewQuestionText(''); setNewQuestionAnswer('');
    });
  };

  // --- O'QUVCHI FUNKSIYALARI ---
  const startExam = () => {
    const questions = Object.values(questionsFromDB[selectedClass] || {});
    if (!studentName || questions.length === 0) return alert("Ism yo'q yoki savollar bo'sh!");
    setExamQuestions([...questions].sort(() => 0.5 - Math.random()));
    setIsExamStarted(true);
  };

  const handleNext = () => {
    const isCorrect = studentInput.trim().toLowerCase() === examQuestions[currentIndex].answer.toLowerCase();
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    setCorrectCount(newCorrect);

    if (currentIndex + 1 < examQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      setStudentInput('');
    } else {
      const percent = Math.round((newCorrect / examQuestions.length) * 100) + '%';
      push(ref(db, 'results'), { name: studentName, score: percent, class: selectedClass, date: new Date().toLocaleString() });
      setStatus(percent);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      {/* REJIMNI ALMASHTIRISH (Tepada o'ngda) */}
      <button
        onClick={() => setIsAdmin(!isAdmin)}
        className="fixed top-4 right-4 bg-white/10 px-4 py-2 rounded-full text-xs font-bold border border-white/20 hover:bg-white/20"
      >
        {isAdmin ? "O'QUVCHI REJIMI" : "O'QITUVCHI REJIMI"}
      </button>

      {!isAdmin ? (
        /* O'QUVCHI REJIMI */
        <div className="max-w-xl mx-auto mt-20">
          {!isExamStarted ? (
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-4">
              <h1 className="text-2xl font-black text-center text-blue-500 uppercase">Matematika Test</h1>
              <input className="w-full p-4 bg-white/5 rounded-xl border border-white/10" placeholder="Ismingiz..." value={studentName} onChange={e => setStudentName(e.target.value)} />
              <select className="w-full p-4 bg-slate-900 rounded-xl" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="7A">7A-sinf</option>
                <option value="8A">8A-sinf</option>
              </select>
              <button onClick={startExam} className="w-full py-4 bg-blue-600 rounded-xl font-bold">BOSHLASH</button>
            </div>
          ) : (
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-center">
              {!status ? (
                <div className="space-y-6">
                  <p className="text-slate-500 uppercase text-xs">Savol: {currentIndex + 1} / {examQuestions.length}</p>
                  <h2 className="text-3xl font-bold italic">"{examQuestions[currentIndex]?.text}"</h2>
                  <input className="w-full p-5 bg-black border-2 border-blue-900 rounded-2xl text-center text-2xl" placeholder="Javob?" value={studentInput} onChange={e => setStudentInput(e.target.value)} />
                  <button onClick={handleNext} className="w-full py-4 bg-blue-600 rounded-xl font-black">KEYINGI SAVOL</button>
                </div>
              ) : (
                <div className="py-10">
                  <h3 className="text-6xl font-black text-green-500">{status}</h3>
                  <p className="mt-4 text-slate-400">Natijangiz saqlandi!</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* O'QITUVCHI REJIMI */
        <div className="max-w-4xl mx-auto space-y-10">
          <h1 className="text-3xl font-black text-emerald-500">ADMIN PANEL</h1>

          {/* SAVOL QO'SHISH FORMASI (Siz rasmda ko'rsatgan mantiq) */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
              <h2 className="font-bold text-slate-400 uppercase text-sm">Yangi savol</h2>
              <select className="w-full p-3 bg-slate-900 rounded-xl" value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                <option value="7A">7A</option>
                <option value="8A">8A</option>
              </select>
              <input className="w-full p-3 bg-white/5 rounded-xl border border-white/10" placeholder="Savol..." value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} />
              <input className="w-full p-3 bg-white/5 rounded-xl border border-white/10" placeholder="Javob..." value={newQuestionAnswer} onChange={e => setNewQuestionAnswer(e.target.value)} />
              <button onClick={addQuestion} className="w-full py-3 bg-emerald-600 rounded-xl font-bold">QO'SHISH</button>
            </div>

            {/* NATIJALAR JADVALI */}
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 h-[400px] overflow-y-auto">
              <h2 className="font-bold text-slate-400 uppercase text-sm mb-4">O'quvchilar natijalari</h2>
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-white/10 text-slate-500 font-normal"><th>Ism</th><th>Sinf</th><th>Ball</th></tr></thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5"><td className="py-2">{r.name}</td><td>{r.class}</td><td className="text-emerald-400">{r.score}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;