import { useEffect, useRef, useState } from 'react';

export function useBriefLoading(duration = 700) {
    const [message, setMessage] = useState('');
    const timerRef = useRef(null);

    const show = (nextMessage) => {
        window.clearTimeout(timerRef.current);
        setMessage(nextMessage);
        timerRef.current = window.setTimeout(() => {
            setMessage('');
        }, duration);
    };

    const clear = () => {
        window.clearTimeout(timerRef.current);
        setMessage('');
    };

    useEffect(() => () => {
        window.clearTimeout(timerRef.current);
    }, []);

    return { message, show, clear };
}
