
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, Plus, LayoutDashboard } from 'lucide-react';
import MathEditor from '../components/MathEditor.jsx';
import MathDisplay from '../components/MathDisplay.jsx';

const TeacherDashboard = () => {
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState([
        { id: 1, text: '', options: [{ a: '', b: '', c: '', d: '' }], correct: 'a' }
    ]);
    const [livePreview, setLivePreview] = useState('');

    const addQuestion = () => {
        setQuestions([...questions, {
            id: questions.length + 1,
            text: '',
            options: [{ a: '', b: '', c: '', d: '' }],
            correct: 'a'
        }]);
    };

    const handleQuestionTextChange = (id, newText) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, text: newText } : q));
        setLivePreview(newText);
    };

    const handleOptionChange = (qId, optKey, value) => {
        // Simplified for prototype: single object in array, but could be cleaner
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                const newOpts = [...q.options];
                newOpts[0] = { ...newOpts[0], [optKey]: value };
                return { ...q, options: newOpts };
            }
            return q;
        }));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container"
            style={{ paddingTop: '6rem' }}
        >
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: 0 }}>
                    <LayoutDashboard size={32} color="var(--color-secondary)" />
                    Imtihon Yaratish
                </h1>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Save size={18} /> Saqlash
                </button>
            </div>

            <div className="grid-cols-2" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>

                {/* Editor Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <input
                            type="text"
                            placeholder="Imtihon nomi..."
                            className="glass-panel"
                            style={{ width: '100%', padding: '1rem', fontSize: '1.5rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none' }}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        {questions.map((q, index) => (
                            <div key={q.id} style={{ marginBottom: '3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2rem' }}>
                                <h3 style={{ color: 'var(--color-secondary)', marginBottom: '1rem' }}>Savol {index + 1}</h3>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-muted)' }}>Savol matni (LaTeX):</label>
                                <MathEditor
                                    value={q.text}
                                    onChange={(val) => handleQuestionTextChange(q.id, val)}
                                    placeholder="Masalan: \frac{a}{b} + \sqrt{x}"
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                                    {['a', 'b', 'c', 'd'].map(opt => (
                                        <div key={opt}>
                                            <span style={{ textTransform: 'uppercase', color: 'var(--color-muted)', fontSize: '0.8rem' }}>Variant {opt}</span>
                                            <MathEditor
                                                value={q.options[0][opt]}
                                                onChange={(val) => handleOptionChange(q.id, opt, val)}
                                                placeholder={`Javob ${opt.toUpperCase()}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button onClick={addQuestion} className="btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} /> Yangi savol qo'shish
                        </button>
                    </div>
                </div>

                {/* Live Preview Panel */}
                <div className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-secondary)', marginTop: 0 }}>
                        <Eye size={20} /> Live Preview
                    </h3>

                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1.5rem', borderRadius: '0.5rem', minHeight: '200px' }}>
                        {livePreview ? (
                            <MathDisplay tex={livePreview} block={true} />
                        ) : (
                            <p style={{ color: 'var(--color-muted)', textAlign: 'center', marginTop: '4rem' }}>
                                Matn kiriting...
                            </p>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ color: 'var(--color-muted)' }}>Tezkor belgilar:</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {['\\frac{a}{b}', '\\sqrt{x}', 'x^2', '\\int', '\\sum'].map(sym => (
                                <button
                                    key={sym}
                                    className="btn-secondary"
                                    style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                                    onClick={() => setLivePreview(prev => prev + " " + sym)} // Prototype action
                                >
                                    <MathDisplay tex={sym} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default TeacherDashboard;
