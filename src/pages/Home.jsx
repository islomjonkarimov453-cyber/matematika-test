
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{ textAlign: 'center', marginBottom: '4rem' }}
            >
                <h1 style={{ fontSize: '4rem', fontWeight: '700', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Matematika Portali
                </h1>
                <p style={{ fontSize: '1.5rem', color: 'var(--color-muted)' }}>
                    Kelajak ta'limi bugun boshlanadi
                </p>
            </motion.div>

            <div className="grid-cols-2" style={{ width: '100%', maxWidth: '900px' }}>

                {/* Teacher Portal Button Card */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-panel"
                    style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', textAlign: 'center' }}
                    onClick={() => navigate('/teacher')}
                >
                    <div style={{ background: 'rgba(34, 211, 238, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                        <GraduationCap size={48} color="var(--color-secondary)" />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>O'qituvchi Portali</h2>
                    <p style={{ color: 'var(--color-muted)' }}>Imtihonlar yarating va baholang</p>
                </motion.div>

                {/* Student Portal Button Card */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-panel"
                    style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', textAlign: 'center' }}
                    onClick={() => navigate('/student')}
                >
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                        <BookOpen size={48} color="var(--color-accent)" />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>O'quvchi Portali</h2>
                    <p style={{ color: 'var(--color-muted)' }}>Bilimingizni sinovdan o'tkazing</p>
                </motion.div>

            </div>
        </div>
    );
};

export default Home;
