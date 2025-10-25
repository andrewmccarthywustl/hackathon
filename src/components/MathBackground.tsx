import { useMemo } from 'react';
import './MathBackground.css';

interface SymbolConfig {
  id: number;
  char: string;
  left: number;
  top: number;
  duration: number;
  delay: number;
  scale: number;
}

export function MathBackground() {
  const symbols = useMemo<SymbolConfig[]>(() => {
    const chars = ['∑', 'π', '∞', '√', '∫', 'Δ', '≈', 'λ'];
    return Array.from({ length: 18 }).map((_, index) => ({
      id: index,
      char: chars[index % chars.length],
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 12 + Math.random() * 10,
      delay: -Math.random() * 10,
      scale: 0.8 + Math.random() * 0.9
    }));
  }, []);

  return (
    <div className="math-background" aria-hidden="true">
      <div className="math-cube-field">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`math-cube cube-${index}`}>
            {Array.from({ length: 6 }).map((__, faceIndex) => (
              <span key={faceIndex} className={`cube-face face-${faceIndex}`} />
            ))}
          </div>
        ))}
      </div>

      {symbols.map((symbol) => (
        <span
          key={symbol.id}
          className="math-symbol"
          style={{
            left: `${symbol.left}%`,
            top: `${symbol.top}%`,
            animationDuration: `${symbol.duration}s`,
            animationDelay: `${symbol.delay}s`,
            fontSize: `${symbol.scale}rem`
          }}
        >
          {symbol.char}
        </span>
      ))}
    </div>
  );
}
