import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, push, remove, set } from "firebase/database";
import * as XLSX from 'xlsx';

function App() {
  // MAXFIY LINK TEKSHIRUVI: sayt.uz/?panel=math123 bo'lsa admin panel ochiladi
  const urlParams = new URLSearchParams(window.location.search);
  const isUrlAdmin = urlParams.get('panel') === 'math123';

  const [isAdmin, setIsAdmin] = useState(isUrlAdmin);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState('7A');
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [questionsFromDB, setQuestionsFromDB] = useState({});
  const [loading, setLoading] = useState(true);

  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentInput, setStudentInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [status, setStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [adminTimeSetting, setAdminTimeSetting] = useState(60);

  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswer, setNewQuestionAnswer] = useState('');
  const [targetClass, setTargetClass] = useState('7A');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const qRef = ref(db, 'questions');
    const rRef = ref(db, 'results');
    const sRef = ref(db, 'settings/timer');

    onValue(qRef, (snapshot) => {
      if (snapshot.exists()) setQuestionsFromDB(snapshot.val());
      setLoading(false);
    });

    onValue(rRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val()).reverse();
        setResults(data);
      } else {
        setResults([]);
      }
    });

    onValue(sRef, (snapshot) => {
      if (snapshot.exists()) setAdminTimeSetting(snapshot.val());
    });
  }, []);

  useEffect(() => {
    let timer;
    if (isExamStarted && !status && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isExamStarted && !status) {
      handleFinish();
    }
    return () => clearInterval(timer);
  }, [isExamStarted, timeLeft, status]);

  const exportToExcel = () => {
    if (results.length === 0) return alert("Hali natijalar yo'q!");
    const dataForExcel = results.map(r => ({
      "O'quvchi ismi": r.name,
      "Sinf": r.class,
      "Natija": r.score,
      "Sana": r.date
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Natijalar");
    XLSX.writeFile(workbook, "Matematika_Test_Natijalari.xlsx");
  };

  const clearAllResults = () => {
    if (window.confirm("DIQQAT! Barcha natijalarni o'chirib tashlamoqchimisiz?")) {
      remove(ref(db, 'results'))
        .then(() => alert("Tozalandi!"))
        .catch(err => alert("Xato: " + err.message));
    }
  };

  const saveTimerSetting = () => {
    set(ref(db, 'settings/timer'), parseInt(adminTimeSetting))
      .then(() => alert("Saqlandi!"))
      .catch(err => alert("Xato: " + err.message));
  };

  const deleteQuestion = (cls, id) => {
    if (window.confirm("O'chirilsinmi?")) remove(ref(db, `questions/${cls}/${id}`));
  };

  const handleCheckPassword = () => {
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
      text: newQuestionText, answer: newQuestionAnswer.trim(), id: Date.now()
    }).then(() => { setNewQuestionText(''); setNewQuestionAnswer(''); });
  };

  const startExam = () => {
    const questions = Object.values(questionsFromDB[selectedClass] || {});
    if (!studentName.trim() || questions.length === 0) return alert("Ism yozilmagan yoki savol yo'q!");
    setExamQuestions([...questions].sort(() => 0.5 - Math.random()));
    setIsExamStarted(true);
    setCurrentIndex(0); setCorrectCount(0); setStatus(null);
    setTimeLeft(adminTimeSetting);
  };

  const handleFinish = () => {
    const percent = Math.round((correctCount / (examQuestions.length || 1)) * 100) + '%';
    push(ref(db, 'results'), {
      name: studentName, score: percent, class: selectedClass, date: new Date().toLocaleString()
    });
    setStatus(percent);
  };

  const handleNext = () => {
    if (!studentInput.trim()) return alert("Javobni yozing!");
    const isCorrect = studentInput.trim().toLowerCase() === examQuestions[currentIndex].answer.toLowerCase();
    if (isCorrect) setCorrectCount(prev => prev + 1);
    if (currentIndex + 1 < examQuestions.length) {
      setCurrentIndex(currentIndex + 1); setStudentInput('');
    } else handleFinish();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold italic animate-pulse">Yuklanmoqda...</div>;

  return (
    <div className={`min-h-screen p-4 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>

      <div className="fixed top-4 left-4 flex gap-2 z-50">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg active:scale-90 transition-transform">
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {!isAdmin ? (
        /* --- O'QUVCHI QISMI (Odatdagi ko'rinish) --- */
        <div className="max-w-xl mx-auto mt-20">
          {!isExamStarted ? (
            <div className={`p-8 rounded-[2.5rem] border shadow-2xl space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <h1 className="text-3xl font-black text-center bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent italic tracking-tighter">MATEMATIKA TEST</h1>
              <input className={`w-full p-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50'}`} placeholder="Ismingiz..." value={studentName} onChange={e => setStudentName(e.target.value)} />
              <select className={`w-full p-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white'}`} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                {['6A', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B'].map(c => <option key={c} value={c}>{c}-sinf</option>)}
              </select>
              <button onClick={startExam} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-500/20">BOSHLASH</button>
            </div>
          ) : (
            <div className={`p-8 rounded-[2.5rem] border shadow-2xl text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              {!status ? (
                <div className="space-y-8">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className={`px-4 py-2 rounded-full ${timeLeft < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500/10 text-blue-500'}`}>⏱ {timeLeft}s</span>
                    <span className="opacity-50 text-sm tracking-widest">SAVOL: {currentIndex + 1}/{examQuestions.length}</span>
                  </div>
                  <h2 className="text-4xl font-bold italic py-4">"{examQuestions[currentIndex]?.text}"</h2>
                  <input className={`w-full p-6 border-2 rounded-3xl text-center text-3xl outline-none ${isDarkMode ? 'bg-black/40 border-blue-900/50 text-blue-400 focus:border-blue-500' : 'bg-slate-50 border-blue-200 text-blue-600 focus:border-blue-500'}`} placeholder="Javob?" value={studentInput} onChange={e => setStudentInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleNext()} autoFocus />
                  <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform">KEYINGI</button>
                </div>
              ) : (
                <div className="py-12 space-y-6">
                  <p className="text-sm opacity-50 font-bold uppercase tracking-widest">Sizning natijangiz:</p>
                  <h3 className="text-8xl font-black text-green-500 drop-shadow-lg">{status}</h3>
                  <button onClick={() => window.location.reload()} className="px-10 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 active:scale-95 transition-all">YANA BOSHLASH</button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* --- O'QITUVCHI PANEL (Faqat ?panel=math123 orqali) --- */
        <div className="max-w-6xl mx-auto mt-20 space-y-8 animate-in fade-in zoom-in duration-500">
          {!isAuthorized ? (
            <div className={`max-w-md mx-auto p-10 rounded-[2.5rem] border shadow-2xl text-center space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-blue-500">O'qituvchi Nazorati</h2>
              <input
                type="password"
                autoFocus
                className={`w-full p-4 rounded-2xl border text-center text-2xl outline-none transition-all ${isDarkMode ? 'bg-black/50 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 focus:border-blue-500'}`}
                placeholder="PAROL"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCheckPassword()}
              />
              <button onClick={handleCheckPassword} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg">KIRISH</button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className={`p-6 rounded-[2rem] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-xs font-black text-blue-500 uppercase mb-4 italic">Vaqt Sozlamasi (soniya)</h2>
                  <div className="flex gap-2">
                    <input type="number" className={`flex-1 p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50'}`} value={adminTimeSetting} onChange={e => setAdminTimeSetting(e.target.value)} />
                    <button onClick={saveTimerSetting} className="px-6 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95">OK</button>
                  </div>
                </div>

                <div className={`p-8 rounded-[2rem] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-xs font-black text-emerald-500 uppercase mb-6">Yangi Savol Qo'shish</h2>
                  <div className="space-y-4">
                    <select className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white'}`} value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                      {['6A', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B'].map(c => <option key={c} value={c}>{c}-sinf</option>)}
                    </select>
                    <textarea className={`w-full p-4 rounded-2xl border outline-none h-24 ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50'}`} placeholder="Savol matni..." value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} />
                    <input className={`w-full p-4 rounded-2xl border outline-none font-bold ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50'}`} placeholder="Javob" value={newQuestionAnswer} onChange={e => setNewQuestionAnswer(e.target.value)} />
                    <button onClick={addQuestion} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black active:scale-95">QO'SHISH</button>
                  </div>
                </div>
              </div>

              <div className={`lg:col-span-3 rounded-[2rem] border overflow-hidden flex flex-col h-[700px] ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}>
                <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <h2 className="font-black text-slate-500 uppercase text-xs italic tracking-widest">O'qituvchi Boshqaruv Paneli</h2>
                  <div className="flex gap-2">
                    <button onClick={exportToExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-emerald-700 active:scale-95 shadow-md">EXCEL</button>
                    <button onClick={clearAllResults} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-700 active:scale-95 shadow-md">TOZALASH</button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-10 scrollbar-hide">
                  <div className="space-y-4">
                    {Object.entries(questionsFromDB).map(([cls, qs]) => (
                      <div key={cls} className="space-y-2">
                        <div className="text-[10px] font-black text-blue-500 bg-blue-500/10 p-1 px-4 rounded-full w-fit">{cls} SINFI</div>
                        {Object.entries(qs).map(([id, q]) => (
                          <div key={id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                            <span className="text-sm opacity-80 italic">"{q.text}"</span>
                            <button onClick={() => deleteQuestion(cls, id)} className="text-red-500 font-bold px-3 hover:bg-red-500/10 rounded-lg">✕</button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-xs font-black text-emerald-500 mb-4 uppercase tracking-widest italic">O'quvchilar Reytingi</h3>
                    <div className="space-y-2">
                      {results.map((r, i) => (
                        <div key={i} className={`flex justify-between items-center p-4 rounded-2xl ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border'}`}>
                          <div><div className="font-black text-sm">{r.name}</div><div className="text-[10px] opacity-40 font-bold">{r.class} | {r.date}</div></div>
                          <div className="font-black text-emerald-500 text-2xl drop-shadow-sm">{r.score}</div>
                        </div>
                      ))}
                      {results.length === 0 && <p className="text-center opacity-30 italic py-10">Hali hech kim test topshirmadi</p>}
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