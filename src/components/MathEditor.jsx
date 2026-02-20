
import React, { useEffect, useRef } from 'react';
import 'mathlive';

const MathEditor = ({ value, onChange, placeholder = "Type a formula..." }) => {
    const mfRef = useRef(null);

    useEffect(() => {
        const mf = mfRef.current;
        if (!mf) return;

        // Configure math-field behavior
        mf.smartMode = true;
        mf.virtualKeyboardMode = 'manual'; // Show keyboard on focus or button click

        const handleInput = (evt) => {
            if (onChange) {
                onChange(evt.target.value);
            }
        };

        mf.addEventListener('input', handleInput);

        return () => {
            mf.removeEventListener('input', handleInput);
        };
    }, []);

    // Sync value from props to math-field
    useEffect(() => {
        if (mfRef.current && mfRef.current.value !== value) {
            mfRef.current.setValue(value);
        }
    }, [value]);

    return (
        <math-field
            ref={mfRef}
            style={{
                display: 'block',
                width: '100%',
                maxWidth: '100%',
                padding: '1rem',
                fontSize: '1.4rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                color: '#fff',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                marginBottom: '1rem',
            }}
        >
            {value}
        </math-field>
    );
};

export default MathEditor;
