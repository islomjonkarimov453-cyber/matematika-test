
import React, { useEffect, useRef } from 'react';

const MatrixBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Mathematical constants and symbols
        const symbols = "01eπϕ∫√∑∞∂∆∇≈≠≤≥±";
        const fontSize = 14;
        const columns = Math.ceil(canvas.width / fontSize);
        // Initialize drops at random vertical positions for variety
        const drops = Array(columns).fill(0).map(() => Math.random() * -50);

        let mouseX = -1000;
        let mouseY = -1000;

        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const draw = () => {
            // Create a semi-transparent fade effect for the trails
            ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = symbols.charAt(Math.floor(Math.random() * symbols.length));
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                // Calculate distance from mouse
                const dist = Math.hypot(x - mouseX, y - mouseY);

                // Highlight color near mouse, faint otherwise
                if (dist < 150) {
                    ctx.fillStyle = 'rgba(34, 211, 238, 0.9)'; // Bright Electric Cyan
                    // Push drops away slightly? Or just highlight. simple highlight is elegant.
                } else {
                    ctx.fillStyle = 'rgba(34, 211, 238, 0.15)'; // Faint
                }

                ctx.fillText(text, x, y);

                // Reset drop to top randomly
                if (y > canvas.height && Math.random() > 0.985) {
                    drops[i] = 0;
                }

                // Move drop down
                drops[i]++;
            }
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none'
            }}
        />
    );
};

export default MatrixBackground;
