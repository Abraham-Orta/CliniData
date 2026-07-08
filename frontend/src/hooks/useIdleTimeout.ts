import { useEffect, useRef } from 'react';

type IdleOptions = {
  onIdle: () => void;
  idleTimeMinutes?: number;
};

export const useIdleTimeout = ({ onIdle, idleTimeMinutes = 15 }: IdleOptions) => {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const onIdleRef = useRef(onIdle);

  // Update the ref each render so we always call the latest onIdle
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const handleIdle = () => {
    onIdleRef.current();
  };

  const resetTimer = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(handleIdle, idleTimeMinutes * 60 * 1000);
  };

  useEffect(() => {
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'wheel',
      'DOMMouseScroll',
      'mousewheel',
      'touchstart',
      'touchmove',
    ];

    const handleEvent = () => {
      resetTimer();
    };

    resetTimer();

    events.forEach((event) => {
      document.addEventListener(event, handleEvent);
    });

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleEvent);
      });
    };
  }, [idleTimeMinutes]);

  return { resetTimer };
};

