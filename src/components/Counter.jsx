import { useEffect, useState } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const Counter = ({ from = 0, to = 0, duration = 1200, decimals = 0, formatValue, className = '' }) => {
  const [value, setValue] = useState(from);

  useEffect(() => {
    let frameId;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(progress);
      const next = from + (to - from) * eased;
      setValue(next);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [from, to, duration]);

  const display = formatValue ? formatValue(value) : value.toFixed(decimals);

  return <span className={className}>{display}</span>;
};

export default Counter;
