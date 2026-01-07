import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  initialCountdown?: number;
  onComplete?: () => void;
  isRunning?: boolean;
  mode?: 'countdown' | 'stopwatch';
}

export const useTimer = ({ 
  initialCountdown = 0, 
  onComplete, 
  isRunning = false,
  mode = 'countdown'
}: UseTimerOptions = {}) => {
  const [countdown, setCountdown] = useState(initialCountdown);
  const timerRef = useRef<number | null>(null);

  const reset = useCallback((value: number = initialCountdown) => {
    setCountdown(value);
  }, [initialCountdown]);

  const start = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setCountdown(prev => {
          if (mode === 'countdown') {
            if (prev <= 1) {
              onComplete?.();
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [isRunning, mode, onComplete, stop]);

  return {
    countdown,
    setCountdown,
    reset,
    start,
    stop
  };
};





