
import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathDisplay = ({ tex = '', block = false, style = {} }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            try {
                katex.render(tex || '', containerRef.current, {
                    throwOnError: false,
                    displayMode: block,
                    strict: false, // avoid strict warnings
                });
            } catch (err) {
                console.error('KaTeX rendering error:', err);
                containerRef.current.innerText = tex || '';
            }
        }
    }, [tex, block]);

    return <span ref={containerRef} style={style} />;
};

export default MathDisplay;
