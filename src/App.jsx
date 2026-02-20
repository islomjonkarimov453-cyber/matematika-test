import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, push, remove, set } from "firebase/database";

function App() {
  // --- 1. UMUMIY STATE-LAR ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState('7A');
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [questionsFromDB, setQuestionsFromDB] = useState({});
  const [loading, setLoading] = useState(true);

  // --- 2. TIMER VA TEST STATE-LARI ---
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentInput, setStudentInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [status, setStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [adminTimeSetting, setAdminTimeSetting] = useState(60); // O'qituvchi belgilagan vaqt

  // --- 3. O'QITUVCHI PANEL STATE-LARI ---
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswer, setNewQuestionAnswer] = useState('');
  const [targetClass, setTargetClass] = useState('7A');
  const [results, setResults] = useState([]);

  // --- BAZADAN MA'LUMOTLARNI OLISH ---
  useEffect(() => {
    const qRef = ref(db, 'questions');
    const rRef = ref(db, 'results');
    const sRef = ref(db, 'settings/timer'); // Vaqt sozlamasi uchun yo'l

    onValue(qRef, (snapshot) => {
      if (snapshot.exists()) setQuestionsFromDB(snapshot.val());
      setLoading(false);
    });

    onValue(rRef, (snapshot) => {
      if (snapshot.exists()) setResults(Object.values(snapshot.val()).reverse());
    });

    // Bazadan o'qituvchi belgilagan vaqtni olish
    onValue(sRef, (snapshot) => {
      if (snapshot.exists()) {
        setAdminTimeSetting(snapshot.val());
      }
    });
  }, []);

  // --- 4. TIMER LOGIKASI ---
  useEffect(() => {
    let timer;
    if (isExamStarted && !status && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isExamStarted && !status) {
      handleFinish();
    }
    return () => clearInterval(timer);
  }, [isExamStarted, timeLeft, status]);

  // --- 5. ADMIN FUNKSIYALARI ---
  const saveTimerSetting = () => {
    set(ref(db, 'settings/timer'), parseInt(adminTimeSetting))
      .then(() => alert("Vaqt muvaffaqiyatli saqlandi!"))
      .catch(err => alert("Xato: " + err.message));
  };

  const deleteQuestion = (cls, id) => {
    if (window.confirm("O'chirishni xohlaysizmi?")) {
      remove(ref(db, `questions/${cls}/${id}`));
    }
  };

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
      setNewQuestionText('');
      setNewQuestionAnswer('');
    });
  };

  // --- 6. TEST FUNKSIYALARI ---
  const startExam = () => {
    const questions = Object.values(questionsFromDB[selectedClass] || {});
    if (!studentName.trim() || questions.length === 0) return alert("Xato!");

    setExamQuestions([...questions].sort(() => 0.5 - Math.random()));
    setIsExamStarted(true);
    setCurrentIndex(0);
    setCorrectCount(0);
    setStatus(null);
    setTimeLeft(adminTimeSetting); // Bazadagi vaqtni ishlatish
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
    if (!studentInput.trim()) return alert("Javob yozing!");
    const isCorrect = studentInput.trim().toLowerCase() === examQuestions[currentIndex].answer.toLowerCase();
    if (isCorrect) setCorrectCount(prev => prev + 1);

    if (currentIndex + 1 < examQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      setStudentInput('');
    } else {
      handleFinish();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Yuklanmoqda...</div>;

  return (
    <div className={`min-h-screen p-4 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>

      {/* REJIM VA ADMIN TUGMALARI */}
      <div className="fixed top-4 left-4 flex gap-2 z-50">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:scale-110 transition-all">
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <button
        onClick={() => { setIsAdmin(!isAdmin); setIsAuthorized(false); }}
        className="fixed top-4 right-4 bg-blue-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg z-50"
      >
        {isAdmin ? "O'QUVCHI" : "O'QITUVCHI"}
      </button>

      {!isAdmin ? (
        <div className="max-w-xl mx-auto mt-20">
          {!isExamStarted ? (
            <div className={`p-8 rounded-[2.5rem] border shadow-2xl space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <h1 className="text-3xl font-black text-center bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">MATEMATIKA TEST</h1>
              <input className={`w-full p-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50'}`} placeholder="Ismingiz..." value={studentName} onChange={e => setStudentName(e.target.value)} />
              <select className={`w-full p-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white'}`} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                {['6A', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B'].map(c => <option key={c} value={c}>{c}-sinf</option>)}
              </select>
              <button onClick={startExam} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl">BOSHLASH</button>
            </div>
          ) : (
            <div className={`p-8 rounded-[2.5rem] border shadow-2xl text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              {!status ? (
                <div className="space-y-8">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className={`px-4 py-2 rounded-full ${timeLeft < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500/10 text-blue-500'}`}>⏱ {timeLeft}s</span>
                    <span className="opacity-50">Savol: {currentIndex + 1}/{examQuestions.length}</span>
                  </div>
                  <h2 className="text-3xl font-bold italic">"{examQuestions[currentIndex]?.text}"</h2>
                  <input className={`w-full p-6 border-2 rounded-3xl text-center text-3xl outline-none ${isDarkMode ? 'bg-black/40 border-blue-900/50 text-blue-400' : 'bg-slate-50 border-blue-200 text-blue-600'}`} placeholder="?" value={studentInput} onChange={e => setStudentInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleNext()} autoFocus />
                  <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg">KEYINGI</button>
                </div>
              ) : (
                <div className="py-12 space-y-6">
                  <h3 className="text-7xl font-black text-green-500">{status}</h3>
                  <button onClick={() => window.location.reload()} className="px-10 py-4 bg-blue-600 text-white rounded-full font-bold">QAYTA BOSHLASH</button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* --- ADMIN PANEL --- */
        <div className="max-w-6xl mx-auto mt-20 space-y-8">
          {!isAuthorized ? (
            <div className={`max-w-md mx-auto p-10 rounded-[2.5rem] border shadow-2xl text-center space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <h2 className="text-2xl font-bold">Admin Kirish</h2>
              <input type="password" className={`w-full p-4 rounded-2xl border text-center text-2xl outline-none ${isDarkMode ? 'bg-black/50 border-white/10 text-white' : 'bg-slate-50 border-slate-300'}`} placeholder="••••" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && checkPassword()} />
              <button onClick={checkPassword} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold">KIRISH</button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-8">
              {/* SAVOL QO'SHISH VA TIMER SOZLAMASI */}
              <div className="lg:col-span-2 space-y-8">
                {/* 1. TIMERNI BELGILASH (YANGI) */}
                <div className={`p-6 rounded-[2rem] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-xs font-black text-blue-500 uppercase mb-4 italic">Test Vaqtini Belgilash (soniya)</h2>
                  <div className="flex gap-2">
                    <input type="number" className={`flex-1 p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50'}`} value={adminTimeSetting} onChange={e => setAdminTimeSetting(e.target.value)} />
                    <button onClick={saveTimerSetting} className="px-6 bg-blue-600 text-white rounded-xl font-bold text-sm">SAQLASH</button>
                  </div>
                </div>

                {/* 2. SAVOL QO'SHISH */}
                <div className={`p-8 rounded-[2rem] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-xs font-black text-emerald-500 uppercase mb-6">Yangi Savol Qo'shish</h2>
                  <div className="space-y-4">
                    <select className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'}`} value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                      {['6A', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <textarea className={`w-full p-4 rounded-2xl border outline-none h-24 ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 text-slate-900'}`} placeholder="Savol..." value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} />
                    <input className={`w-full p-4 rounded-2xl border outline-none font-bold ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 text-slate-900'}`} placeholder="To'g'ri javob" value={newQuestionAnswer} onChange={e => setNewQuestionAnswer(e.target.value)} />
                    <button onClick={addQuestion} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black">QO'SHISH</button>
                  </div>
                </div>
              </div>

              {/* BOSHQUROV VA NATIJALAR */}
              <div className={`lg:col-span-3 rounded-[2rem] border overflow-hidden flex flex-col h-[700px] ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}>
                <div className="p-6 border-b border-white/10 bg-white/5">
                  <h2 className="font-black text-slate-500 uppercase text-xs">Savollar & Natijalar</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-10 scrollbar-hide">
                  <div className="space-y-4">
                    {Object.entries(questionsFromDB).map(([cls, qs]) => (
                      <div key={cls} className="space-y-2">
                        <div className="text-[10px] font-bold text-blue-500 bg-blue-500/5 p-1 px-3 rounded-full w-fit">{cls}-sinf</div>
                        {Object.entries(qs).map(([id, q]) => (
                          <div key={id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-red-500/40 transition-all">
                            <span className="text-sm opacity-80">"{q.text}"</span>
                            <button onClick={() => deleteQuestion(cls, id)} className="text-red-500 font-bold px-3">✕</button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-xs font-bold text-emerald-500 mb-4 uppercase">Test Natijalari</h3>
                    <div className="space-y-2">
                      {results.map((r, i) => (
                        <div key={i} className={`flex justify-between items-center p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-50 border border-slate-200'}`}>
                          <div><div className="font-bold text-sm">{r.name}</div><div className="text-[10px] opacity-40">{r.class} | {r.date}</div></div>
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