import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, push, remove } from "firebase/database";

function App() {
  // --- 1. UMUMIY STATE-LAR ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // TUNGI REJIM
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState('7A');
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [questionsFromDB, setQuestionsFromDB] = useState({});
  const [loading, setLoading] = useState(true);

  // --- 2. O'QUVCHI TEST VA TIMER STATE-LARI ---
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentInput, setStudentInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [status, setStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60); // 60 SONIYA TIMER

  // --- 3. O'QITUVCHI PANEL STATE-LARI ---
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswer, setNewQuestionAnswer] = useState('');
  const [targetClass, setTargetClass] = useState('7A');
  const [results, setResults] = useState([]);

  // --- BAZADAN MA'LUMOTLARNI OLISH ---
  useEffect(() => {
    const qRef = ref(db, 'questions');
    const rRef = ref(db, 'results');

    const unsubQ = onValue(qRef, (snapshot) => {
      if (snapshot.exists()) setQuestionsFromDB(snapshot.val());
      setLoading(false);
    });

    const unsubR = onValue(rRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val()).reverse();
        setResults(data);
      }
    });

    return () => { unsubQ(); unsubR(); };
  }, []);

  // --- 4. TIMER LOGIKASI ---
  useEffect(() => {
    let timer;
    if (isExamStarted && !status && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isExamStarted && !status) {
      handleFinish(); // Vaqt tugasa avtomatik tugatish
    }
    return () => clearInterval(timer);
  }, [isExamStarted, timeLeft, status]);

  const checkPassword = () => {
    if (adminPassword === "matematika") {
      setIsAuthorized(true);
      setAdminPassword('');
    } else {
      alert("Parol noto'g'ri!");
    }
  };

  const addQuestion = () => {
    if (!newQuestionText.trim() || !newQuestionAnswer.trim()) return alert("To'ldiring!");
    push(ref(db, `questions/${targetClass}`), {
      text: newQuestionText,
      answer: newQuestionAnswer.trim(),
      id: Date.now()
    }).then(() => {
      alert("Savol qo'shildi!");
      setNewQuestionText('');
      setNewQuestionAnswer('');
    });
  };

  // --- 5. SAVOLNI O'CHIRISH (ADMIN) ---
  const deleteQuestion = (cls, id) => {
    if (window.confirm("Ushbu savolni o'chirishni xohlaysizmi?")) {
      remove(ref(db, `questions/${cls}/${id}`));
    }
  };

  const startExam = () => {
    const questions = Object.values(questionsFromDB[selectedClass] || {});
    if (!studentName.trim()) return alert("Ismingizni kiriting!");
    if (questions.length === 0) return alert("Savollar yo'q!");

    setExamQuestions([...questions].sort(() => 0.5 - Math.random()));
    setIsExamStarted(true);
    setCurrentIndex(0);
    setCorrectCount(0);
    setStatus(null);
    setTimeLeft(60);
  };

  const handleFinish = () => {
    const percent = Math.round((correctCount / examQuestions.length) * 100) + '%';
    push(ref(db, 'results'), {
      name: studentName,
      score: percent,
      class: selectedClass,
      date: new Date().toLocaleString()
    });
    setStatus(percent);
  };

  const handleNext = () => {
    if (!studentInput.trim()) return alert("Javobni yozing!");
    const isCorrect = studentInput.trim().toLowerCase() === examQuestions[currentIndex].answer.toLowerCase();
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    setCorrectCount(newCorrect);

    if (currentIndex + 1 < examQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      setStudentInput('');
    } else {
      handleFinish();
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className={`min-h-screen p-4 font-sans transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>

      {/* 🌓 REJIM VA ADMIN TUGMALARI */}
      <div className="fixed top-4 left-4 flex gap-2 z-50">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:scale-110 transition-all text-xl">
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <button
        onClick={() => { setIsAdmin(!isAdmin); setIsAuthorized(false); }}
        className="fixed top-4 right-4 bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-blue-500 z-50 transition-all active:scale-95"
      >
        {isAdmin ? "O'QUVCHI" : "O'QITUVCHI"}
      </button>

      {!isAdmin ? (
        <div className="max-w-xl mx-auto mt-16">
          {!isExamStarted ? (
            <div className={`p-8 rounded-[2.5rem] border shadow-2xl space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <h1 className="text-3xl font-black text-center bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent uppercase">Matematika Test</h1>
              <input className={`w-full p-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} placeholder="Ismingiz..." value={studentName} onChange={e => setStudentName(e.target.value)} />
              <select className={`w-full p-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'}`} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                {['6A', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B'].map(c => <option key={c} value={c}>{c}-sinf</option>)}
              </select>
              <button onClick={startExam} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-500 transition-all">BOSHLASH</button>
            </div>
          ) : (
            <div className={`p-8 rounded-[2.5rem] border shadow-2xl text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              {!status ? (
                <div className="space-y-8">
                  <div className="flex justify-between items-center text-xs font-bold uppercase">
                    <span className={`px-4 py-2 rounded-full ${timeLeft < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500/10 text-blue-500'}`}>⏱ {timeLeft}s</span>
                    <span className="text-slate-500">Savol: {currentIndex + 1}/{examQuestions.length}</span>
                  </div>
                  <h2 className="text-3xl font-bold italic">"{examQuestions[currentIndex]?.text}"</h2>
                  <input className={`w-full p-6 border-2 rounded-3xl text-center text-3xl outline-none transition-all ${isDarkMode ? 'bg-black/40 border-blue-900/50 text-blue-400' : 'bg-slate-50 border-blue-200 text-blue-600'}`} placeholder="?" value={studentInput} onChange={e => setStudentInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleNext()} autoFocus />
                  <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg">KEYINGI</button>
                </div>
              ) : (
                <div className="py-12 space-y-6 text-center">
                  <h3 className="text-7xl font-black text-green-500">{status}</h3>
                  <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Ofarin, {studentName}!</p>
                  <button onClick={() => window.location.reload()} className="px-10 py-4 bg-blue-600 text-white rounded-full font-bold">YANA BIR BOR</button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto mt-16 space-y-8">
          {!isAuthorized ? (
            <div className={`max-w-md mx-auto p-10 rounded-[2.5rem] border shadow-2xl text-center space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <h2 className="text-2xl font-bold">Admin Kirish</h2>
              <input type="password" className={`w-full p-4 rounded-2xl border text-center text-2xl outline-none ${isDarkMode ? 'bg-black/50 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} placeholder="••••" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && checkPassword()} />
              <button onClick={checkPassword} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold">KIRISH</button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-8">
              {/* 6. SAVOL QO'SHISH */}
              <div className={`lg:col-span-2 p-8 rounded-[2rem] border h-fit sticky top-24 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <h2 className="font-black text-slate-400 uppercase text-xs mb-6">Yangi Savol</h2>
                <div className="space-y-4">
                  <select className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-300'}`} value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                    {['6A', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <textarea className={`w-full p-4 rounded-2xl border outline-none h-32 resize-none ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} placeholder="Savol matni..." value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} />
                  <input className={`w-full p-4 rounded-2xl border outline-none font-bold ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} placeholder="Javob" value={newQuestionAnswer} onChange={e => setNewQuestionAnswer(e.target.value)} />
                  <button onClick={addQuestion} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black">QO'SHISH</button>
                </div>
              </div>

              {/* 7. SAVOLLARNI O'CHIRISH VA NATIJALAR */}
              <div className={`lg:col-span-3 rounded-[2rem] border overflow-hidden flex flex-col h-[700px] ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="p-6 border-b border-white/10 flex justify-between bg-white/5">
                  <h2 className="font-black text-slate-400 uppercase text-xs tracking-tighter">Boshqaruv Paneli</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-10 scrollbar-hide">

                  {/* SAVOLLAR RO'YXATI */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-blue-500 uppercase px-2">Savollar (O'chirish uchun x bosing)</h3>
                    {Object.entries(questionsFromDB).map(([cls, qs]) => (
                      <div key={cls} className="space-y-2">
                        <div className="text-[10px] font-black text-slate-500 bg-slate-500/5 p-1 px-3 rounded-full w-fit">{cls}-sinf</div>
                        {Object.entries(qs).map(([id, q]) => (
                          <div key={id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-red-500/30 transition-all">
                            <span className="text-sm italic opacity-80">"{q.text}"</span>
                            <button onClick={() => deleteQuestion(cls, id)} className="text-red-500 hover:bg-red-500/20 px-3 py-1 rounded-lg font-bold transition-all">✕</button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* NATIJALAR JADVALI */}
                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-xs font-bold text-emerald-500 uppercase px-2 mb-4">O'quvchilar Natijalari</h3>
                    <div className="space-y-2">
                      {results.map((r, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                          <div>
                            <div className="font-bold text-sm">{r.name}</div>
                            <div className="text-[10px] opacity-40">{r.date} | {r.class}</div>
                          </div>
                          <div className="font-black text-emerald-500 text-xl">{r.score}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;