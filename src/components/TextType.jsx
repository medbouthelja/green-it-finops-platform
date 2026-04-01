import { useEffect, useMemo, useState } from 'react';

const TextType = ({
  texts = ['Bienvenue'],
  typingSpeed = 80,
  deletingSpeed = 45,
  pauseMs = 1200,
  className = '',
}) => {
  const safeTexts = useMemo(() => (texts.length ? texts : ['Bienvenue']), [texts]);
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = safeTexts[textIndex];

    if (!isDeleting && displayText === fullText) {
      const pauseTimeout = setTimeout(() => setIsDeleting(true), pauseMs);
      return () => clearTimeout(pauseTimeout);
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % safeTexts.length);
      return undefined;
    }

    const timeout = setTimeout(() => {
      const nextLength = isDeleting ? displayText.length - 1 : displayText.length + 1;
      setDisplayText(fullText.slice(0, nextLength));
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, safeTexts, textIndex, typingSpeed, deletingSpeed, pauseMs]);

  return (
    <p className={className}>
      {displayText}
      <span className="ml-1 inline-block h-5 w-px bg-emerald-100/90 align-middle animate-pulse" />
    </p>
  );
};

export default TextType;
