'use client';

import { useState, useRef } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    timerRef.current = setTimeout(() => setVisible(true), 200);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  const move = (e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY - 36 });
  };

  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onMouseMove={move}
    >
      {children}
      {visible && (
        <div
          className="tooltip-content"
          style={{ left: pos.x, top: pos.y, transform: 'translateX(-50%)' }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
