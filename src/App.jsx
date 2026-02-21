import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { db } from './firebase';
import { ref, onValue, push, remove, set } from "firebase/database";
import * as XLSX from 'xlsx';

function App() {
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

  // Firebase Ma'lumotlarini yuklash
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
      if (snapshot.exists()) {
        const timeVal = snapshot.val();
        setAdminTimeSetting(timeVal);
        if (!isExamStarted) setTimeLeft(timeVal);
      }
    });
  }, [isExamStarted]);

  // Taymer mantiqi
  useEffect(() => {
    let timer;
    if (isExamStarted && !status && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isExamStarted && !status) {
      handleFinish();
    }
    return () => clearInterval(timer);
  }, [isExamStarted, timeLeft, status]);

  // --- ANTI-CHEAT TIZIMI ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isExamStarted && !status && document.hidden) {
        alert("DIQQAT: Sahifadan chiqqaningiz uchun testingiz yakunlandi!");
        handleFinish();
      }
    };

    const handleContextMenu = (e) => {
      if (isExamStarted) e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isExamStarted, status]);

  // --- AQLLI EXCEL YUKLASH FUNKSIYASI ---
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let count = 0;
        data.forEach((row) => {
          if (!row || row.length < 2) return;
          const rawQ = row[0] ? row[0].toString().trim() : "";
          const rawA = row[1] ? row[1].toString().trim() : "";
          const skipWords = ["savol", "javob", "question", "answer", "№", "n", "t/r"];
          if (skipWords.includes(rawQ.toLowerCase()) || skipWords.includes(rawA.toLowerCase())) return;

          if (rawQ && rawA) {
            push(ref(db, `questions/${targetClass}`), {
              text: rawQ,
              answer: rawA,
              id: Date.now() + Math.random()
            });
            count++;
          }
        });
        alert(`${count} ta savol muvaffaqiyatli yuklandi!`);
      } catch (err) {
        alert("Faylni o'qishda xatolik!");
      }
      e.target.value = null;
    };
    reader.readAsBinaryString(file);
  };

  // Admin funksiyalari
  const exportToExcel = () => {
    if (results.length === 0) return alert("Natijalar yo'q!");
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Natijalar");
    XLSX.writeFile(workbook, "Natijalar.xlsx");
  };

  const clearAllResults = () => {
    if (window.confirm("Barcha natijalarni o'chirish?")) remove(ref(db, 'results'));
  };

  const handleCheckPassword = () => {
    if (adminPassword === "matematika") {
      setIsAuthorized(true);
      setAdminPassword('');
    } else {
      alert("Parol xato!");
    }
  };

  const addQuestion = () => {
    if (!newQuestionText.trim() || !newQuestionAnswer.trim()) return alert("To'ldiring!");
    push(ref(db, `questions/${targetClass}`), {
      text: newQuestionText, answer: newQuestionAnswer.trim(), id: Date.now()
    }).then(() => { setNewQuestionText(''); setNewQuestionAnswer(''); });
  };

  // --- TEST MANTIQI (TUZATILGAN) ---
  const startExam = () => {
    const classData = questionsFromDB[selectedClass];
    if (!studentName.trim()) return alert("Iltimos, ismingizni kiriting!");
    if (!classData || Object.keys(classData).length === 0) return alert("Bu sinf uchun savollar topilmadi!");

    const questionsArray = Object.values(classData);
    setExamQuestions([...questionsArray].sort(() => 0.5 - Math.random()));

    // Holatlarni reset qilish
    setCurrentIndex(0);
    setCorrectCount(0);
    setStudentInput('');
    setStatus(null);
    setTimeLeft(adminTimeSetting);
    setIsExamStarted(true);
  };

  const handleFinish = () => {
    // CorrectCount holati darhol yangilanmasligi mumkinligini hisobga olib, 
    // natijani xavfsiz hisoblash
    setExamQuestions(prevQuestions => {
      const finalScore = Math.round((correctCount / (prevQuestions.length || 1)) * 100) + '%';
      push(ref(db, 'results'), {
        name: studentName,
        score: finalScore,
        class: selectedClass,
        date: new Date().toLocaleString()
      });
      setStatus(finalScore);
      return prevQuestions;
    });
  };

  const handleNext = () => {
    if (!studentInput.trim()) return alert("Javob yozing!");

    const currentQ = examQuestions[currentIndex];
    // Javobni solishtirishda toString() va trim() ishlatamiz (Exceldagi raqamlar uchun)
    if (studentInput.trim().toLowerCase() === currentQ.answer.toString().toLowerCase().trim()) {
      setCorrectCount(prev => prev + 1);
    }

    if (currentIndex + 1 < examQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setStudentInput('');
    } else {
      handleFinish();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">Yuklanmoqda...</div>;

  return (
    <Router>
      <div className={`min-h-screen p-4 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className="fixed top-4 left-4 z-50">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg active:scale-90 transition-transform">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <Routes>
          <Route path="/" element={
            <div className="max-w-xl mx-auto mt-20">
              {!isExamStarted ? (
                <div className={`p-8 rounded-[2.5rem] border shadow-2xl space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <h1 className="text-3xl font-black text-center bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent italic">MATEMATIKA TEST</h1>
                  <input className={`w-full p-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50'}`} placeholder="Ismingiz..." value={studentName} onChange={e => setStudentName(e.target.value)} />
                  <select className={`w-full p-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white'}`} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                    {['6A', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B'].map(c => <option key={c} value={c}>{c}-sinf</option>)}
                  </select>
                  <button onClick={startExam} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all hover:bg-blue-700">BOSHLASH</button>
                </div>
              ) : (
                <div className={`p-8 rounded-[2.5rem] border shadow-2xl text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  {!status ? (
                    <div className="space-y-8">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className={`px-4 py-2 rounded-full ${timeLeft < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500/10 text-blue-500'}`}>⏱ {timeLeft}s</span>
                        <span className="opacity-50 text-sm">SAVOL: {currentIndex + 1}/{examQuestions.length}</span>
                      </div>
                      <h2 className="text-4xl font-bold italic py-4">"{examQuestions[currentIndex]?.text}"</h2>
                      <input className={`w-full p-6 border-2 rounded-3xl text-center text-3xl outline-none ${isDarkMode ? 'bg-black/40 border-blue-900/50 text-blue-400 focus:border-blue-500' : 'bg-slate-50 border-blue-200 text-blue-600 focus:border-blue-500'}`} placeholder="Javob?" value={studentInput} onChange={e => setStudentInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleNext()} autoFocus />
                      <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform">KEYINGI</button>
                    </div>
                  ) : (
                    <div className="py-12 space-y-6">
                      <p className="text-sm opacity-50 font-bold uppercase tracking-widest">Sizning natijangiz:</p>
                      <h3 className="text-8xl font-black text-green-500 drop-shadow-lg">{status}</h3>
                      <button onClick={() => window.location.reload()} className="px-10 py-4 bg-blue-600 text-white rounded-full font-bold active:scale-95 transition-all">YANA BOSHLASH</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          } />

          <Route path="/admin" element={
            <div className="max-w-6xl mx-auto mt-20 space-y-8">
              {!isAuthorized ? (
                <div className={`max-w-md mx-auto p-10 rounded-[2.5rem] border shadow-2xl text-center space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-2xl font-black italic text-blue-500">ADMIN KIRISH</h2>
                  <input type="password" autoFocus className={`w-full p-4 rounded-2xl border text-center text-2xl outline-none ${isDarkMode ? 'bg-black/50 text-white' : 'bg-slate-50'}`} placeholder="PAROL" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCheckPassword()} />
                  <button onClick={handleCheckPassword} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg">KIRISH</button>
                </div>
              ) : (
                <div className="grid lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className={`p-6 rounded-[2rem] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                      <h2 className="text-xs font-black text-blue-500 uppercase mb-4">Vaqt (soniya)</h2>
                      <div className="flex gap-2">
                        <input type="number" className={`flex-1 p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-black/30 text-white' : 'bg-slate-50'}`} value={adminTimeSetting} onChange={e => setAdminTimeSetting(e.target.value)} />
                        <button onClick={() => set(ref(db, 'settings/timer'), parseInt(adminTimeSetting))} className="px-6 bg-blue-600 text-white rounded-xl font-bold active:scale-95">OK</button>
                      </div>
                    </div>

                    <div className={`p-8 rounded-[2rem] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                      <h2 className="text-xs font-black text-emerald-500 uppercase mb-6">Yangi Savol</h2>
                      <div className="space-y-4">
                        <select className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white'}`} value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                          {['6A', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B'].map(c => <option key={c} value={c}>{c}-sinf</option>)}
                        </select>
                        <textarea className={`w-full p-4 rounded-2xl border outline-none h-24 ${isDarkMode ? 'bg-black/30 text-white' : 'bg-slate-50'}`} placeholder="Savol matni..." value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} />
                        <input className={`w-full p-4 rounded-2xl border outline-none font-bold ${isDarkMode ? 'bg-black/30 text-white' : 'bg-slate-50'}`} placeholder="Javob" value={newQuestionAnswer} onChange={e => setNewQuestionAnswer(e.target.value)} />
                        <button onClick={addQuestion} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black active:scale-95">QO'SHISH</button>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/10">
                        <h2 className="text-[10px] font-black text-orange-500 uppercase mb-3">Excel orqali ommaviy yuklash</h2>
                        <label className={`block w-full p-4 rounded-2xl border-2 border-dashed cursor-pointer text-center transition-all ${isDarkMode ? 'border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5' : 'border-slate-300 hover:border-orange-500 hover:bg-orange-50'}`}>
                          <span className="text-xs opacity-60 font-bold italic">Faylni tanlang (.xlsx)</span>
                          <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className={`lg:col-span-3 rounded-[2rem] border overflow-hidden flex flex-col h-[750px] ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <h2 className="font-black text-slate-500 uppercase text-xs tracking-widest">Admin Boshqaruv Paneli</h2>
                      <div className="flex gap-2">
                        <button onClick={exportToExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-md">EXCEL</button>
                        <button onClick={clearAllResults} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-md">TOZALASH</button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-10 scrollbar-hide">
                      <div className="space-y-4">
                        {Object.entries(questionsFromDB).map(([cls, qs]) => (
                          <div key={cls} className="space-y-2">
                            <div className="text-[10px] font-black text-blue-500 bg-blue-500/10 p-1 px-4 rounded-full w-fit">{cls} SINFI</div>
                            {Object.entries(qs).map(([id, q]) => (
                              <div key={id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-sm opacity-80 italic">"{q.text}"</span>
                                <button onClick={() => remove(ref(db, `questions/${cls}/${id}`))} className="text-red-500 font-bold px-3">✕</button>
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
                              <div className="font-black text-emerald-500 text-2xl">{r.score}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;