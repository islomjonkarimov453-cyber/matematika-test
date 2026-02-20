
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Check, X } from "lucide-react";
import MathDisplay from "../components/MathDisplay.jsx";

const StudentDashboard = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [showResult, setShowResult] = useState(false);

    // Mock data for questions
    const questions = [
        {
            id: 1,
            text: "Xisoblang: \\int_{0}^{1} x^2 dx",
            options: [
                { id: "a", text: "\\frac{1}{3}" },
                { id: "b", text: "\\frac{1}{2}" },
                { id: "c", text: "1" },
                { id: "d", text: "0" },
            ],
            correct: "a",
        },
        {
            id: 2,
            text: "Funksiyaning hosilasini toping: f(x) = \\sqrt{x}",
            options: [
                { id: "a", text: "\\frac{1}{2\\sqrt{x}}" },
                { id: "b", text: "2\\sqrt{x}" },
                { id: "c", text: "\\frac{1}{x}" },
                { id: "d", text: "x^{\\frac{3}{2}}" },
            ],
            correct: "a",
        },
        {
            id: 3,
            text: "Tenglamani yeching: x^2 - 4 = 0",
            options: [
                { id: "a", text: "x = \\pm 2" },
                { id: "b", text: "x = 4" },
                { id: "c", text: "x = 2" },
                { id: "d", text: "x = -2" },
            ],
            correct: "a",
        }
    ];

    // Timer logic
    useEffect(() => {
        if (timeLeft > 0 && !submitted) {
            const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            setSubmitted(true);
        }
    }, [timeLeft, submitted]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const handleSelect = (optionId) => {
        if (submitted) return;
        setAnswers({ ...answers, [currentQuestion]: optionId });
    };

    const submitExam = () => {
        setSubmitted(true);
        setShowResult(true);
    };

    const currentQ = questions[currentQuestion];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container"
            style={{
                paddingTop: "6rem",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            {/* Timer Bar */}
            <div
                className="glass-panel"
                style={{
                    width: "100%",
                    padding: "1rem 2rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                    maxWidth: "800px",
                }}
            >
                <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>
                    Matematika Testi
                </span>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: timeLeft < 300 ? "var(--color-accent)" : "var(--color-text)",
                    }}
                >
                    <Clock size={20} />
                    <span style={{ fontFamily: "monospace", fontSize: "1.5rem" }}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!showResult ? (
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="glass-panel"
                        style={{
                            padding: "2rem",
                            width: "100%",
                            maxWidth: "800px",
                            minHeight: "400px",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div
                            style={{
                                marginBottom: "2rem",
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span
                                style={{
                                    color: "var(--color-secondary)",
                                    fontWeight: "bold",
                                    textTransform: "uppercase",
                                }}
                            >
                                Savol {currentQuestion + 1} / {questions.length}
                            </span>
                        </div>

                        <div style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>
                            <MathDisplay tex={currentQ.text} block={true} />
                        </div>

                        <div
                            className="grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "1rem",
                            }}
                        >
                            {currentQ.options.map((opt) => (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    key={opt.id}
                                    onClick={() => handleSelect(opt.id)}
                                    style={{
                                        padding: "1.5rem",
                                        borderRadius: "0.5rem",
                                        border:
                                            answers[currentQuestion] === opt.id
                                                ? "2px solid var(--color-secondary)"
                                                : "1px solid var(--glass-border)",
                                        background:
                                            answers[currentQuestion] === opt.id
                                                ? "rgba(34, 211, 238, 0.1)"
                                                : "transparent",
                                        color: "var(--color-text)",
                                        fontSize: "1.2rem",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "1rem",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: "30px",
                                            height: "30px",
                                            borderRadius: "50%",
                                            border: "1px solid currentColor",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        {opt.id.toUpperCase()}
                                    </span>
                                    <MathDisplay tex={opt.text} />
                                </motion.button>
                            ))}
                        </div>

                        <div
                            style={{
                                marginTop: "auto",
                                display: "flex",
                                justifyContent: "space-between",
                                paddingTop: "2rem",
                            }}
                        >
                            <button
                                className="btn-secondary"
                                disabled={currentQuestion === 0}
                                onClick={() => setCurrentQuestion((c) => c - 1)}
                                style={{ opacity: currentQuestion === 0 ? 0.5 : 1 }}
                            >
                                Oldingi
                            </button>

                            {currentQuestion < questions.length - 1 ? (
                                <button
                                    className="btn-primary"
                                    onClick={() => setCurrentQuestion((c) => c + 1)}
                                >
                                    Keyingi
                                </button>
                            ) : (
                                <button
                                    className="btn-primary"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, var(--color-success) 0%, #10b981 100%)",
                                    }}
                                    onClick={submitExam}
                                >
                                    Yakunlash
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel"
                        style={{
                            padding: "3rem",
                            maxWidth: "600px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                background: "rgba(52, 211, 153, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "2rem",
                            }}
                        >
                            <Check size={40} color="var(--color-success)" />
                        </div>
                        <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
                            Tabriklaymiz!
                        </h2>
                        <p style={{ color: "var(--color-muted)", fontSize: "1.2rem" }}>
                            Siz testni muvaffaqiyatli topshirdingiz.
                        </p>
                        <div
                            style={{
                                marginTop: "2rem",
                                padding: "2rem",
                                background: "rgba(255,255,255,0.05)",
                                borderRadius: "1rem",
                                width: "100%",
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: "3rem", color: "var(--color-secondary)" }}>
                                {Object.keys(answers).length}/{questions.length}
                            </h3>
                            <span style={{ color: "var(--color-muted)" }}>To'g'ri javoblar</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default StudentDashboard;
