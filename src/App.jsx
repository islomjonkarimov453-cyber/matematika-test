import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

// 1. Firebase Konfiguratsiyasi
const firebaseConfig = {
  apiKey: "Aizasydavfnh4iv4y2qqns9_56q5tc8noazvsl0",
  authDomain: "matematika-onlayn-777.firebaseapp.com",
  databaseURL: "https://matematika-onlayn-777-default-rtdb.firebaseio.com",
  projectId: "matematika-onlayn-777",
  storageBucket: "matematika-onlayn-777.appspot.com",
  messagingSenderId: "326361727081",
  appId: "1:326361727081:web:84c7b73c73e4aa9d9c22f8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function App() {
  const [role, setRole] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [adminClass, setAdminClass] = useState('7A');
  const [studentName, setStudentName] = useState('');
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [studentInput, setStudentInput] = useState('');
  const [status, setStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionsByClass, setQuestionsByClass] = useState({ '7A': [], '8A': [], '9B': [], '10A': [] });
  const [results, setResults] = useState([]);
  const [tempImg, setTempImg] = useState(null);

  // 2. ONLAYN BAZADAN MA'LUMOTLARNI O'QISH
  useEffect(() => {
    const qRef = ref(db, 'questions');
    const unsubscribeQuestions = onValue(qRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setQuestionsByClass(data);
    });

    const rRef = ref(db, 'results');
    const unsubscribeResults = onValue(rRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const resList = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        setResults(resList.reverse()); // Yangi natijalar tepada chiqadi
      } else {
        setResults([]);
      }
    });

    return () => {
      unsubscribeQuestions();
      unsubscribeResults();
    };
  }, []);

  // Taymer
  useEffect(() => {
    let timer;
    if (isExamStarted && timeLeft > 0 && !status) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isExamStarted && !status) {
      finishExam();
    }
    return () => clearInterval(timer);
  }, [isExamStarted, timeLeft, status]);

  const handleUpload = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('https://api.imgbb.com/1/upload?key=9d18f27522173fe03488a500e26889fd', {
        method: 'POST', body: formData
      });
      const data = await res.json();
      return data.success ? data.data.url : null;
    } catch { return null; }
  };

  const saveQuestion = () => {
    const text = document.getElementById('qTxt').value;
    const answer = document.getElementById('qAns').value;

    if (!text || !answer) {
      alert("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }

    const newQ = { text, answer, image: tempImg || "", id: Date.now() };
    const updatedClassList = [...(questionsByClass[adminClass] || []), newQ];

    set(ref(db, 'questions/' + adminClass), updatedClassList)
      .then(() => {
        alert("✅ Savol saqlandi!");
        document.getElementById('qTxt').value = '';
        document.getElementById('qAns').value = '';
        setTempImg(null);
      });
  };

  const startExam = () => {
    const list = questionsByClass[selectedClass] || [];
    if (!studentName.trim() || list.length === 0) return alert("Ism kiriting yoki savollar yo'q!");
    const randomQ = list[Math.floor(Math.random() * list.length)];
    setCurrentQuestion(randomQ);
    setTimeLeft(60);
    setIsExamStarted(true);
    setStatus(null);
    setStudentInput('');
  };

  const finishExam = () => {
    const isCorrect = studentInput.trim().toLowerCase() === currentQuestion.answer.toString().toLowerCase();
    const scoreValue = isCorrect ? '100%' : '0%';

    const newResult = {
      name: studentName,
      score: scoreValue,
      studentClass: selectedClass,
      date: new Date().toLocaleString()
    };

    push(ref(db, 'results'), newResult);
    setStatus(scoreValue);
  };

  const clearResults = () => {
    if (window.confirm("Barcha natijalarni o'chirib tashlamoqchimisiz?")) {
      remove(ref(db, 'results'));
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black mb-10 text-blue-500 italic uppercase italic">Matematika Online</h1>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {['7A', '8A', '9B', '10A'].map(c => (
            <button key={c} onClick={() => { setSelectedClass(c); setRole('student'); }} className="p-8 bg-white/5 border border-white/10 rounded-3xl text-2xl font-bold active:scale-95 transition-all">
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => setRole('teacher')} className="mt-12 text-slate-700 text-xs font-bold uppercase tracking-widest underline">O'qituvchi boshqaruvi</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 min-h-screen bg-black text-white">
      <nav className="flex justify-between py-6 border-b border-white/10 mb-6">
        <span className="font-black text-blue-500 text-xl italic">{selectedClass || 'ADMIN PANEL'}</span>
        <button onClick={() => window.location.reload()} className="text-[10px] bg-white/10 px-4 py-2 rounded-full font-bold uppercase">Chiqish</button>
      </nav>

      {role === 'teacher' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
          {/* Savol qo'shish */}
          <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
            <h3 className="text-xs font-bold text-blue-500 uppercase mb-4 tracking-widest">Yangi savol qo'shish</h3>
            <select value={adminClass} onChange={e => setAdminClass(e.target.value)} className="w-full p-4 bg-black rounded-xl border border-white/10 mb-4 text-white">
              {['7A', '8A', '9B', '10A'].map(c => <option key={c} value={c}>{c} sinfi</option>)}
            </select>
            <textarea id="qTxt" placeholder="Savol matni..." className="w-full p-4 bg-black rounded-xl h-24 border border-white/10 mb-4 text-white" />
            <input id="qAns" placeholder="To'g'ri javob" className="w-full p-4 bg-black rounded-xl border border-white/10 mb-4 text-white" />
            <div className="flex items-center gap-4 mb-4">
              <input type="file" id="fileInput" className="hidden" onChange={async (e) => setTempImg(await handleUpload(e.target.files[0]))} />
              <label htmlFor="fileInput" className="cursor-pointer bg-white/10 px-4 py-2 rounded-lg text-xs font-bold">📷 Rasm yuklash</label>
              {tempImg && <span className="text-green-500 text-[10px]">✅ Yuklandi</span>}
            </div>
            <button onClick={saveQuestion} className="w-full py-4 bg-blue-600 rounded-2xl font-black uppercase active:scale-95 transition-all">Onlayn Saqlash</button>
          </div>

          {/* Savollar ro'yxati */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hozirgi savollar ({adminClass}):</h3>
            {(questionsByClass[adminClass] || []).map((q, i) => (
              <div key={q.id} className="p-4 bg-white/5 rounded-2xl flex justify-between items-center border border-white/5">
                <span className="text-sm">{i + 1}. {q.text}</span>
                <button onClick={() => {
                  const filtered = questionsByClass[adminClass].filter(item => item.id !== q.id);
                  set(ref(db, 'questions/' + adminClass), filtered);
                }} className="bg-red-500/10 text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all">🗑️</button>
              </div>
            ))}
          </div>

          {/* NATIJALAR JADVALI (FAQAT O'QITUVCHIDA) */}
          <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-blue-500 uppercase italic">📊 Natijalar</h3>
              <button onClick={clearResults} className="text-[10px] text-red-500 font-bold border border-red-500/20 px-3 py-1 rounded-lg">HAMMASINI O'CHIRISH</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-slate-500 uppercase text-[10px] tracking-widest">
                    <th className="px-4 py-2">O'quvchi</th>
                    <th className="px-4 py-2">Sinf</th>
                    <th className="px-4 py-2">Ball</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res) => (
                    <tr key={res.id} className="bg-white/5">
                      <td className="px-4 py-3 rounded-l-xl font-bold">{res.name}</td>
                      <td className="px-4 py-3 text-slate-400">{res.studentClass}</td>
                      <td className={`px-4 py-3 rounded-r-xl font-black ${res.score === '100%' ? 'text-green-500' : 'text-red-500'}`}>{res.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {results.length === 0 && <p className="text-center py-10 text-slate-600 italic">Hozircha natijalar yo'q</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in duration-500">
          {!isExamStarted ? (
            <div className="bg-white/5 p-10 rounded-[3rem] text-center space-y-6 border border-white/10">
              <h2 className="text-2xl font-black uppercase text-blue-500">{selectedClass} IMTIHONI</h2>
              <p className="text-slate-400 text-sm">Ismingizni kiriting va boshlang</p>
              <input placeholder="ISMINGIZ" className="w-full p-5 bg-black border border-white/10 rounded-2xl text-center text-white font-bold uppercase focus:border-blue-500 outline-none transition-all" onChange={e => setStudentName(e.target.value)} />
              <button onClick={startExam} className="w-full py-6 bg-blue-600 rounded-[2rem] font-black text-xl active:scale-95 transition-all shadow-lg shadow-blue-600/20">BOSHLASH</button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-center relative overflow-hidden">
                <div className="text-5xl font-mono text-blue-500 mb-6 font-black">{timeLeft}s</div>
                {currentQuestion?.image && <img src={currentQuestion.image} className="w-full rounded-2xl mb-6 border border-white/10 shadow-xl" alt="Savol" />}
                <p className="text-2xl font-bold italic">"{currentQuestion?.text}"</p>
              </div>
              {!status ? (
                <div className="space-y-4">
                  <input className="w-full p-6 bg-white/5 rounded-[2rem] text-center text-5xl border border-blue-900 text-white font-black outline-none focus:border-blue-500" placeholder="?" type="text" onChange={e => setStudentInput(e.target.value)} />
                  <button onClick={finishExam} className="w-full py-5 bg-blue-600 rounded-[2rem] font-black text-xl uppercase tracking-widest">Yuborish</button>
                </div>
              ) : (
                <div className="p-10 bg-white/5 rounded-[3rem] text-center border border-white/10 animate-in zoom-in duration-300">
                  <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase">Sening natijang:</h4>
                  <h4 className={`text-9xl font-black mb-8 ${status === '100%' ? 'text-green-500' : 'text-red-500'}`}>{status}</h4>
                  <button onClick={() => setIsExamStarted(false)} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase hover:bg-blue-500 hover:text-white transition-all">Yana urinish</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;