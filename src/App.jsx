import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Firebase sozlamalaringiz to'g'riligiga ishonch hosil qiling
import { ref, push } from 'firebase/database';

// Savollar bazasi (Buni o'zingiz xohlagancha boyitishingiz mumkin)
const questionsByClass = {
  "5-sinf": [
    { id: 1, text: "15 * 4 = ?", answer: "60" },
    { id: 2, text: "100 / 5 = ?", answer: "20" },
    { id: 3, text: "12 + 18 = ?", answer: "30" }
  ],
  "6-sinf": [
    { id: 4, text: "2^3 = ?", answer: "8" },
    { id: 5, text: "√36 = ?", answer: "6" },
    { id: 6, text: "15% of 200 = ?", answer: "30" }
  ]
};

function App() {
  // --- STATE-LAR ---
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState('5-sinf');
  const [isExamStarted, setIsExamStarted] = useState(false);

  // Imtihon mantiqi uchun yangi state-lar
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentInput, setStudentInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [status, setStatus] = useState(null); // Yakuniy natija (%)
  const [timeLeft, setTimeLeft] = useState(60);

  // --- TAYMER ---
  useEffect(() => {
    let timer;
    if (isExamStarted && !status && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !status) {
      handleNext(); // Vaqt tugasa keyingi savolga o'tadi
    }
    return () => clearInterval(timer);
  }, [isExamStarted, timeLeft, status]);

  // --- FUNKSIYALAR ---
  const startExam = () => {
    const questions = questionsByClass[selectedClass] || [];
    if (!studentName.trim()) return alert("Iltimos, ismingizni kiriting!");
    if (questions.length === 0) return alert("Bu sinf uchun savollar hali qo'shilmagan!");

    // Savollarni aralashtirish
    const shuffled = [...questions].sort(() => 0.5 - Math.random());

    setExamQuestions(shuffled);
    setCurrentIndex(0);
    setCorrectCount(0);
    setStudentInput('');
    setStatus(null);
    setTimeLeft(60);
    setIsExamStarted(true);
  };

  const handleNext = () => {
    const currentQ = examQuestions[currentIndex];
    const isCorrect = studentInput.trim().toLowerCase() === currentQ.answer.toString().toLowerCase();

    let newScore = correctCount;
    if (isCorrect) {
      newScore = correctCount + 1;
      setCorrectCount(newScore);
    }

    if (currentIndex + 1 < examQuestions.length) {
      // Keyingi savolga o'tish
      setCurrentIndex(currentIndex + 1);
      setStudentInput('');
      setTimeLeft(60);
    } else {
      // Imtihon tugadi
      const finalPercent = Math.round((newScore / examQuestions.length) * 100);
      const resultMsg = `${finalPercent}%`;

      // Firebase-ga saqlash
      const resultData = {
        name: studentName,
        score: resultMsg,
        correctAnswers: `${newScore}/${examQuestions.length}`,
        studentClass: selectedClass,
        date: new Date().toLocaleString()
      };
      push(ref(db, 'results'), resultData);

      setStatus(resultMsg);
    }
  };

  // --- INTERFEYS ---
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">

      {!isExamStarted ? (
        /* KIRISH QISMI */
        <div className="w-full max-w-md space-y-6 bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-2xl">
          <h1 className="text-3xl font-black text-center text-blue-500 uppercase tracking-tighter">Matematika Test</h1>
          <input
            className="w-full p-5 bg-white/5 rounded-2xl border border-white/10 outline-none focus:border-blue-500 transition-all"
            placeholder="Ismingizni yozing"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
          <select
            className="w-full p-5 bg-slate-900 rounded-2xl border border-white/10 outline-none"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="5-sinf">5-Sinf</option>
            <option value="6-sinf">6-Sinf</option>
          </select>
          <button
            onClick={startExam}
            className="w-full py-5 bg-blue-600 rounded-2xl font-bold text-xl hover:bg-blue-700 transition-transform active:scale-95"
          >
            TESTNI BOSHLASH
          </button>
        </div>
      ) : (
        /* TEST QISMI */
        <div className="w-full max-w-2xl bg-white/5 p-10 rounded-[3rem] border border-white/10 relative overflow-hidden">
          {!status ? (
            <div className="space-y-8 text-center">
              <div className="flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-widest">
                <span className="bg-white/10 px-4 py-2 rounded-full">Savol: {currentIndex + 1} / {examQuestions.length}</span>
                <span className={`px-4 py-2 rounded-full ${timeLeft < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500/20 text-blue-400'}`}>
                  Vaqt: {timeLeft}s
                </span>
              </div>

              <h2 className="text-4xl font-black italic text-white leading-tight">
                {examQuestions[currentIndex]?.text}
              </h2>

              <div className="space-y-4">
                <input
                  autoFocus
                  className="w-full p-6 bg-black/40 border-2 border-blue-900 rounded-3xl text-center text-4xl text-white font-black outline-none focus:border-blue-500"
                  placeholder="?"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                />
                <button
                  onClick={handleNext}
                  className="w-full py-5 bg-blue-600 rounded-3xl font-black text-xl hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all"
                >
                  {currentIndex + 1 === examQuestions.length ? "TUGATISH" : "KEYINGI SAVOL →"}
                </button>
              </div>
            </div>
          ) : (
            /* NATIJA QISMI */
            <div className="text-center space-y-6 py-10">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-slate-400">{studentName}, natijangiz:</h3>
              <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-emerald-400">
                {status}
              </div>
              <p className="text-slate-500 font-medium">Natijangiz o'qituvchiga yuborildi.</p>
              <button
                onClick={() => setIsExamStarted(false)}
                className="mt-8 px-10 py-4 bg-white/10 rounded-full font-bold hover:bg-white/20"
              >
                BOSH SAHIFA
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;