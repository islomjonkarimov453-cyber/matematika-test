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

  // Firebase yuklash
  useEffect(() => {
    onValue(ref(db, 'questions'), (snapshot) => {
      if (snapshot.exists()) setQuestionsFromDB(snapshot.val());
      setLoading(false);
    });
    onValue(ref(db, 'results'), (snapshot) => {
      if (snapshot.exists()) setResults(Object.values(snapshot.val()).reverse());
      else setResults([]);
    });
    onValue(ref(db, 'settings/timer'), (snapshot) => {
      if (snapshot.exists()) setAdminTimeSetting(snapshot.val());
    });
  }, []);

  // Taymer
  useEffect(() => {
    let timer;
    if (isExamStarted && !status && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isExamStarted && !status) {
      handleFinish();
    }
    return () => clearInterval(timer);
  }, [isExamStarted, timeLeft, status]);

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
      let count = 0;
      data.forEach((row) => {
        if (!row || row.length < 2) return;
        const q = row[0]?.toString().trim();
        const a = row[1]?.toString().trim();
        if (q && a && !["savol", "javob"].includes(q.toLowerCase())) {
          push(ref(db, `questions/${targetClass}`), { text: q, answer: a, id: Date.now() + Math.random() });
          count++;
        }
      });
      alert(count + " ta savol yuklandi!");
    };
    reader.readAsBinaryString(file);
  };

  const handleCheckPassword = () => {
    if (adminPassword === "matematika") { setIsAuthorized(true); setAdminPassword(''); }
    else alert("Parol xato!");
  };

  const startExam = () => {
    const questions = Object.values(questionsFromDB[selectedClass] || {});
    if (!studentName.trim() || questions.length === 0) return alert("Ism kiriting yoki savollar mavjud emas!");
    setExamQuestions([...questions].sort(() => 0.5 - Math.random()));
    setIsExamStarted(true);
    setCurrentIndex(0); setCorrectCount(0); setStatus(null); setTimeLeft(adminTimeSetting);
  };

  const handleFinish = () => {
    const percent = Math.round((correctCount / (examQuestions.length || 1)) * 100) + '%';
    push(ref(db, 'results'), { name: studentName, score: percent, class: selectedClass, date: new Date().toLocaleString() });
    setStatus(percent);
  };

  const handleNext = () => {
    if (!studentInput.trim()) return;
    if (studentInput.trim().toLowerCase() === examQuestions[currentIndex].answer.toLowerCase()) setCorrectCount(c => c + 1);
    if (currentIndex + 1 < examQuestions.length) { setCurrentIndex(i => i + 1); setStudentInput(''); }
    else handleFinish();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black italic animate-pulse">YUKLANMOQDA...</div>;

  return (
    <Router>
      <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>

        {/* Dark Mode */}
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="fixed top-4 left-4 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        <Routes>
          {/* 1. O'QUVCHI YO'LI */}
          <Route path="/oquvchi" element={
            <div className="max-w-xl mx-auto mt-20">
              {!isExamStarted ? (
                <div className={`p-8 rounded-[2.5rem] border shadow-2xl space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <h1 className="text-3xl font-black text-center bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent italic">O'QUVCHI TEST</h1>
                  <input className={`w-full p-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50'}`} placeholder="Ismingiz..." value={studentName} onChange={e => setStudentName(e.target.value)} />
                  <select className={`w-full p-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white'}`} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                    {['6A', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B'].map(c => <option key={c} value={c}>{c}-sinf</option>)}
                  </select>
                  <button onClick={startExam} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">TESTNI BOSHLASH</button>
                </div>
              ) : (
                <div className={`p-8 rounded-[2.5rem] border shadow-2xl text-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  {!status ? (
                    <div className="space-y-8">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className={`px-4 py-2 rounded-full ${timeLeft < 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500/10 text-blue-500'}`}>⏱ {timeLeft}s</span>
                        <span className="opacity-50">SAVOL: {currentIndex + 1}/{examQuestions.length}</span>
                      </div>
                      <h2 className="text-4xl font-bold italic py-4">"{examQuestions[currentIndex]?.text}"</h2>
                      <input className={`w-full p-6 border-2 rounded-3xl text-center text-3xl outline-none ${isDarkMode ? 'bg-black/40 border-blue-900/50 text-blue-400 focus:border-blue-500' : 'bg-slate-50 border-blue-200 text-blue-600'}`} placeholder="Javob..." value={studentInput} onChange={e => setStudentInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleNext()} autoFocus />
                      <button onClick={handleNext} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg active:scale-95 transition-transform">KEYINGI</button>
                    </div>
                  ) : (
                    <div className="py-12 space-y-6 animate-bounce">
                      <h3 className="text-8xl font-black text-green-500">{status}</h3>
                      <button onClick={() => window.location.reload()} className="px-10 py-4 bg-blue-600 text-white rounded-full font-bold">YANA BOSHLASH</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          } />

          {/* 2. USTOZ YO'LI */}
          <Route path="/ustoz" element={
            <div className="max-w-6xl mx-auto mt-10 space-y-8 p-4">
              <h1 className="text-2xl font-black text-emerald-500 italic">USTOZLAR PANELI</h1>
              <div className="grid lg:grid-cols-2 gap-8">
                <div className={`p-8 rounded-[2rem] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-lg'}`}>
                  <h2 className="text-sm font-black mb-4 opacity-50 uppercase">Savol Qo'shish</h2>
                  <div className="space-y-4">
                    <select className={`w-full p-3 rounded-xl border outline-none ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white'}`} value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                      {['6A', '7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B'].map(c => <option key={c} value={c}>{c}-sinf</option>)}
                    </select>
                    <textarea className={`w-full p-4 rounded-2xl border outline-none h-24 ${isDarkMode ? 'bg-black/30' : 'bg-slate-50'}`} placeholder="Savol matni..." value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} />
                    <input className={`w-full p-4 rounded-2xl border outline-none font-bold ${isDarkMode ? 'bg-black/30' : 'bg-slate-50'}`} placeholder="Javob" value={newQuestionAnswer} onChange={e => setNewQuestionAnswer(e.target.value)} />
                    <button onClick={() => { push(ref(db, `questions/${targetClass}`), { text: newQuestionText, answer: newQuestionAnswer.trim(), id: Date.now() }); setNewQuestionText(''); setNewQuestionAnswer(''); }} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black active:scale-95">SAQLASH</button>
                  </div>
                </div>
                <div className={`p-8 rounded-[2rem] border overflow-y-auto h-[500px] ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-sm font-black mb-4 opacity-50 uppercase tracking-widest text-orange-500">O'quvchilar Reytingi</h2>
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
          } />

          {/* 3. ADMIN YO'LI */}
          <Route path="/admin" element={
            <div className="max-w-6xl mx-auto mt-20 space-y-8 p-4">
              {!isAuthorized ? (
                <div className={`max-w-md mx-auto p-10 rounded-[2.5rem] border shadow-2xl text-center space-y-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-2xl font-black text-red-500">SUPER ADMIN</h2>
                  <input type="password" autoFocus className="w-full p-4 rounded-2xl border text-center text-2xl outline-none bg-transparent" placeholder="PAROL" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleCheckPassword()} />
                  <button onClick={handleCheckPassword} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg">KIRISH</button>
                </div>
              ) : (
                <div className="grid lg:grid-cols-5 gap-8 animate-in fade-in">
                  <div className="lg:col-span-2 space-y-6">
                    <div className={`p-6 rounded-[2rem] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white'}`}>
                      <h2 className="text-xs font-black text-blue-500 uppercase mb-4 tracking-tighter">Test Vaqti (Soniya)</h2>
                      <div className="flex gap-2">
                        <input type="number" className="flex-1 p-3 rounded-xl border outline-none bg-transparent font-bold" value={adminTimeSetting} onChange={e => setAdminTimeSetting(e.target.value)} />
                        <button onClick={() => set(ref(db, 'settings/timer'), parseInt(adminTimeSetting))} className="px-6 bg-blue-600 text-white rounded-xl font-bold">OK</button>
                      </div>
                    </div>
                    <div className={`p-6 rounded-[2rem] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white'}`}>
                      <h2 className="text-xs font-black text-orange-500 uppercase mb-4 tracking-tighter">Excel orqali ommaviy yuklash</h2>
                      <input type="file" className="text-xs block w-full" accept=".xlsx, .xls" onChange={handleExcelUpload} />
                    </div>
                  </div>
                  <div className={`lg:col-span-3 rounded-[2rem] border flex flex-col h-[700px] ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white shadow-xl'}`}>
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h2 className="font-black text-xs opacity-50 uppercase">Barcha savollar va Tozalash</h2>
                      <div className="flex gap-2">
                        <button onClick={exportToExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black italic">EXCEL YUKLASH</button>
                        <button onClick={() => window.confirm("HAMMASINI O'CHIRISH?") && remove(ref(db, 'results'))} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black italic">NATIJALARNI TOZALASH</button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
                      {Object.entries(questionsFromDB).map(([cls, qs]) => (
                        <div key={cls} className="space-y-2">
                          <div className="text-[10px] font-black text-blue-500 bg-blue-500/10 p-1 px-4 rounded-full w-fit">{cls} SINFI</div>
                          {Object.entries(qs).map(([id, q]) => (
                            <div key={id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                              <span className="text-sm opacity-80 italic">"{q.text}"</span>
                              <button onClick={() => remove(ref(db, `questions/${cls}/${id}`))} className="text-red-500 font-bold px-3 hover:scale-125 transition-transform">✕</button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          } />

          <Route path="/" element={<Navigate to="/oquvchi" />} />
          <Route path="*" element={<Navigate to="/oquvchi" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;