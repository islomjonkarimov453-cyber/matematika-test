import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, push } from "firebase/database";

function App() {
  // --- UMUMIY STATE-LAR ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState('7A');
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [questionsFromDB, setQuestionsFromDB] = useState({});
  const [loading, setLoading] = useState(true); // Yuklanish holati

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
    const qRef = ref(db, 'questions');
    const rRef = ref(db, 'results');

    const unsubQ = onValue(qRef, (snapshot) => {
      if (snapshot.exists()) {
        setQuestionsFromDB(snapshot.val());
      }
      setLoading(false); // Ma'lumot kelgach loadingni o'chirish
    });

    const unsubR = onValue(rRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val()).reverse();
        setResults(data);
      }
    });

    return () => { unsubQ(); unsubR(); };
  }, []);

  // --- ADMIN PAROL TEKSHIRISH ---
  const checkPassword = () => {
    if (adminPassword === "matematika") {
      setIsAuthorized(true);
      setAdminPassword('');
    } else {
      alert("Parol noto'g'ri!");
    }
  };

  // --- SAVOL QO'SHISH ---
  const addQuestion = () => {
    if (!newQuestionText.trim() || !newQuestionAnswer.trim()) return alert("Maydonlarni to'ldiring!");
    push(ref(db, `questions/${targetClass}`), {
      text: newQuestionText,
      answer: newQuestionAnswer.trim(),
      id: Date.now()
    }).then(() => {
      alert("Savol muvaffaqiyatli qo'shildi!");
      setNewQuestionText('');
      setNewQuestionAnswer('');
    }).catch((error) => alert("Xato: " + error.message));
  };

  // --- TESTNI BOSHLASH ---
  const startExam = () => {
    const questions = Object.values(questionsFromDB[selectedClass] || {});
    if (!studentName.trim()) return alert("Ismingizni kiriting!");
    if (questions.length === 0) return alert("Bu sinf uchun savollar hali qo'shilmagan!");

    setExamQuestions([...questions].sort(() => 0.5 - Math.random()));
    setIsExamStarted(true);
    setCurrentIndex(0);
    setCorrectCount(0);
    setStatus(null);
  };

  // --- KEYINGI SAVOL / TUGATISH ---
  const handleNext = () => {
    if (!studentInput.trim()) return alert("Javobni yozing!");

    const isCorrect = studentInput.trim().toLowerCase() === examQuestions[currentIndex].answer.toLowerCase();
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    setCorrectCount(newCorrect);

    if (currentIndex + 1 < examQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      setStudentInput('');
    } else {
      const percent = Math.round((newCorrect / examQuestions.length) * 100) + '%';
      push(ref(db, 'results'), {
        name: studentName,
        score: percent,
        class: selectedClass,
        date: new Date().toLocaleString()
      });
      setStatus(percent);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 font-sans selection:bg-blue-500/30">
      {/* REJIM ALMASHTIRGICH */}
      <button
        onClick={() => { setIsAdmin(!isAdmin); setIsAuthorized(false); }}
        className="fixed top-4 right-4 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full text-xs font-bold border border-white/20 hover:bg-white/20 z-50 transition-all active:scale-95"
      >
        {isAdmin ? "O'QUVCHI REJIMI" : "O'QITUVCHI REJIMI"}
      </button>

      {!isAdmin ? (
        <div className="max-w-xl mx-auto mt-16 md:mt-24">
          {!isExamStarted ? (
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent uppercase tracking-wider">Matematika Test</h1>
                <p className="text-slate-500 text-sm">Bilimingizni sinab ko'ring</p>
              </div>
              <input className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 focus:border-blue-500 outline-none transition-all text-lg" placeholder="Ismingiz..." value={studentName} onChange={e => setStudentName(e.target.value)} />
              <select className="w-full p-4 bg-slate-900 rounded-2xl border border-white/10 outline-none cursor-pointer" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="6A">6A-sinf</option>
                <option value="7A">7A-sinf</option>
                <option value="7B">7B-sinf</option>
                <option value="8A">8A-sinf</option>
                <option value="8B">8B-sinf</option>
                <option value="9A">9A-sinf</option>
                <option value="9B">9B-sinf</option>
                <option value="10A">10A-sinf</option>
                <option value="10B">10B-sinf</option>
                <option value="11A">11A-sinf</option>
                <option value="11B">11B-sinf</option>

              </select>
              <button onClick={startExam} className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">TESTNI BOSHLASH</button>
            </div>
          ) : (
            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center">
              {!status ? (
                <div className="space-y-8">
                  <div className="flex justify-between items-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                    <span>Sinf: {selectedClass}</span>
                    <span>Savol: {currentIndex + 1} / {examQuestions.length}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight italic text-blue-50">"{examQuestions[currentIndex]?.text}"</h2>
                  <input className="w-full p-6 bg-black/40 border-2 border-blue-900/50 rounded-3xl text-center text-3xl font-mono text-blue-400 focus:border-blue-500 outline-none transition-all shadow-inner" placeholder="?" value={studentInput} onChange={e => setStudentInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleNext()} autoFocus />
                  <button onClick={handleNext} className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-lg transition-all active:scale-[0.98]">KEYINGI SAVOL</button>
                </div>
              ) : (
                <div className="py-12 space-y-6">
                  <div className="inline-flex p-4 bg-green-500/10 rounded-full">
                    <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h3 className="text-7xl font-black text-green-500 tabular-nums">{status}</h3>
                  <p className="text-slate-400 text-lg font-medium">Ofarin, {studentName}! <br /> Natijangiz bazaga saqlandi.</p>
                  <button onClick={() => window.location.reload()} className="px-10 py-4 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold border border-white/10 transition-all">ASOSIY SAHIFAGA QAYTISH</button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto mt-16 md:mt-20">
          {!isAuthorized ? (
            <div className="max-w-md mx-auto bg-white/5 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl text-center space-y-6">
              <div className="p-4 bg-emerald-500/10 inline-block rounded-3xl">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h2 className="text-2xl font-bold">O'qituvchi Nazorati</h2>
              <input type="password" className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl mb-4 text-center text-2xl tracking-[0.5em] focus:border-emerald-500 outline-none transition-all" placeholder="••••" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && checkPassword()} />
              <button onClick={checkPassword} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all">KIRISH</button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <h1 className="text-4xl font-black text-emerald-500 uppercase tracking-tighter">Admin Panel</h1>
                <div className="flex gap-4 items-center">
                  <div className="px-4 py-2 bg-emerald-500/10 rounded-xl text-emerald-500 text-sm font-bold border border-emerald-500/20">Onlayn: {results.length} ta natija</div>
                </div>
              </header>

              <div className="grid lg:grid-cols-5 gap-8">
                {/* SAVOL QO'SHISH */}
                <div className="lg:col-span-2 bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-6 h-fit sticky top-24">
                  <h2 className="font-black text-slate-400 uppercase text-xs tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Yangi Savol Qo'shish
                  </h2>
                  <div className="space-y-4">
                    <label className="block text-sm text-slate-500 font-bold">Sinfni tanlang:</label>
                    <div className="flex gap-2">
                      {['7A', '8A'].map(cls => (
                        <button key={cls} onClick={() => setTargetClass(cls)} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${targetClass === cls ? 'bg-emerald-600 border-emerald-500' : 'bg-white/5 border-white/10 text-slate-400'}`}>{cls}</button>
                      ))}
                    </div>
                    <textarea className="w-full p-4 bg-black/30 rounded-2xl border border-white/10 focus:border-emerald-500 outline-none h-32 resize-none transition-all" placeholder="Savol matni (masalan: 15 + 25 = ?)" value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} />
                    <input className="w-full p-4 bg-black/30 rounded-2xl border border-white/10 focus:border-emerald-500 outline-none font-bold" placeholder="To'g'ri javob" value={newQuestionAnswer} onChange={e => setNewQuestionAnswer(e.target.value)} />
                    <button onClick={addQuestion} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-lg transition-all shadow-lg shadow-emerald-600/10">BAZAGA QO'SHISH</button>
                  </div>
                </div>

                {/* NATIJALAR JADVALI */}
                <div className="lg:col-span-3 bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden flex flex-col h-[600px]">
                  <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <h2 className="font-black text-slate-400 uppercase text-xs tracking-widest">O'quvchilar Natijalari</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {results.length > 0 ? (
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-900 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                          <tr>
                            <th className="p-6">O'quvchi</th>
                            <th className="p-6 text-center">Sinf</th>
                            <th className="p-6 text-right">Ball</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {results.map((r, i) => (
                            <tr key={i} className="group hover:bg-white/5 transition-colors">
                              <td className="p-6">
                                <div className="font-bold text-blue-100 group-hover:text-blue-400 transition-colors">{r.name}</div>
                                <div className="text-[10px] text-slate-600 mt-1 font-mono">{r.date}</div>
                              </td>
                              <td className="p-6 text-center">
                                <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-slate-400">{r.class}</span>
                              </td>
                              <td className="p-6 text-right font-black text-xl text-emerald-400 tabular-nums">{r.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                        <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <p className="font-medium italic">Hozircha natijalar yo'q...</p>
                      </div>
                    )}
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