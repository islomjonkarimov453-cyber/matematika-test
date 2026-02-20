import React, { useState, useEffect } from 'react';
import { db } from './firebase';
// MUHIM: Mana bu importlar bo'lmasa, kod "ref is not defined" xatosini beradi
import { ref, onValue, push } from "firebase/database";

function App() {
  // --- STATE-LAR ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState('7A');
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [questionsFromDB, setQuestionsFromDB] = useState({});
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentInput, setStudentInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [status, setStatus] = useState(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswer, setNewQuestionAnswer] = useState('');
  const [targetClass, setTargetClass] = useState('7A');
  const [results, setResults] = useState([]);

  // --- BAZADAN MA'LUMOT OLISH ---
  useEffect(() => {
    const qRef = ref(db, 'questions');
    const rRef = ref(db, 'results');

    // Savollarni tinglash
    const unsubscribeQuestions = onValue(qRef, (snapshot) => {
      if (snapshot.exists()) setQuestionsFromDB(snapshot.val());
    });

    // Natijalarni tinglash
    const unsubscribeResults = onValue(rRef, (snapshot) => {
      if (snapshot.exists()) {
        // Ma'lumotlarni teskari tartibda (oxirgi chiqqanlar yuqorida) ko'rsatish
        const data = Object.values(snapshot.val()).reverse();
        setResults(data);
      }
    });

    return () => {
      unsubscribeQuestions();
      unsubscribeResults();
    };
  }, []);

  // --- FUNKSIYALAR ---
  const checkPassword = () => {
    if (adminPassword === "islomjon11") {
      setIsAuthorized(true);
      setAdminPassword('');
    } else {
      alert("Parol noto'g'ri!");
    }
  };

  const addQuestion = () => {
    if (!newQuestionText || !newQuestionAnswer) return alert("To'ldiring!");
    push(ref(db, `questions/${targetClass}`), {
      text: newQuestionText,
      answer: newQuestionAnswer,
      id: Date.now()
    }).then(() => {
      alert("Savol qo'shildi!");
      setNewQuestionText('');
      setNewQuestionAnswer('');
    });
  };

  const startExam = () => {
    const questions = Object.values(questionsFromDB[selectedClass] || {});
    if (!studentName.trim() || questions.length === 0) {
      return alert("Ismingizni yozing yoki bu sinfda savollar hali yo'q!");
    }
    setExamQuestions([...questions].sort(() => 0.5 - Math.random()));
    setIsExamStarted(true);
    setCurrentIndex(0);
    setCorrectCount(0);
    setStatus(null);
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

  // --- JSX (Interfeys) ---
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <button
        onClick={() => {
          setIsAdmin(!isAdmin);
          setIsAuthorized(false);
        }}
        className="fixed top-4 right-4 bg-white/10 px-4 py-2 rounded-full text-xs font-bold border border-white/20 hover:bg-white/20 z-50 transition-all"
      >
        {isAdmin ? "O'QUVCHI REJIMI" : "O'QITUVCHI REJIMI"}
      </button>

      {/* Interfeys qolgan qismi siz yozganingizdek qoladi... */}
      {/* Faqat inputlarga onChange va value bog'liqligi to'g'ri ekanligini tekshiring */}
    </div>
  );
}

export default App;