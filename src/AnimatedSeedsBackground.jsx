import React, { useEffect, useRef } from 'react';

// Semilla SVGs: diente de león y arce, tonos neutros y opacidad baja
const SEED_SVGS = [
  // Diente de león
  `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:0.3;"><circle cx="11" cy="11" r="2.5" fill="#b9a77a"/><path d="M11 2v7" stroke="#b9a77a" stroke-width="1.1" stroke-linecap="round"/><path d="M11 13v7" stroke="#b9a77a" stroke-width="1.1" stroke-linecap="round"/><path d="M2 11h7" stroke="#b9a77a" stroke-width="1.1" stroke-linecap="round"/><path d="M13 11h7" stroke="#b9a77a" stroke-width="1.1" stroke-linecap="round"/></svg>`,
  // Semilla de arce
  `<svg width="28" height="12" viewBox="0 0 28 12" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:0.22;"><ellipse cx="7" cy="6" rx="7" ry="3" fill="#cfc2a1"/><ellipse cx="21" cy="6" rx="7" ry="3" fill="#e3d7bc"/></svg>`
];

// Genera semillas con posiciones y animaciones aleatorias
function randomSeeds(num = 12, width = 100, height = 100) {
  return Array.from({ length: num }).map((_, i) => {
    const svg = SEED_SVGS[Math.floor(Math.random() * SEED_SVGS.length)];
    const top = Math.random() * 90 + '%';
    const size = 18 + Math.random() * 18;
    const duration = 18 + Math.random() * 16; // segundos
    const delay = -Math.random() * duration;
    const rotate = Math.random() * 40 - 20;
    const leftStart = -10 - Math.random() * 10;
    const leftEnd = 100 + Math.random() * 10;
    return {
      key: `seed-${i}`,
      svg,
      style: {
        position: 'absolute',
        top,
        left: `${leftStart}%`,
        width: size,
        height: 'auto',
        pointerEvents: 'none',
        transform: `rotate(${rotate}deg)`
      },
      anim: {
        duration,
        delay,
        leftStart,
        leftEnd,
        rotate
      }
    };
  });
}

const AnimatedSeedsBackground = () => {
  const seedsRef = useRef([]);
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;
    const seeds = seedsRef.current;
    seeds.forEach((el, i) => {
      if (!el) return;
      const { duration, delay, leftStart, leftEnd, rotate } = el.dataset;
      el.animate([
        { left: `${leftStart}%`, transform: `rotate(${rotate}deg)` },
        { left: `${leftEnd}%`, transform: `rotate(${rotate + (Math.random() * 30 - 15)}deg)` }
      ], {
        duration: parseFloat(duration) * 1000,
        delay: parseFloat(delay) * 1000,
        iterations: Infinity,
        direction: 'normal',
        easing: 'cubic-bezier(0.5,0,0.7,1)'
      });
    });
  }, []);

  const seeds = randomSeeds(13);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 60% 20%, #fffbe8 80%, #f6f1e3 100%)',
        overflow: 'hidden',
        width: '100vw',
        height: '100vh',
        minHeight: 420,
        transition: 'background 0.8s'
      }}
      aria-hidden="true"
    >
      {seeds.map((seed, i) => (
        <span
          key={seed.key}
          ref={el => seedsRef.current[i] = el}
          style={seed.style}
          dangerouslySetInnerHTML={{ __html: seed.svg }}
          data-duration={seed.anim.duration}
          data-delay={seed.anim.delay}
          data-left-start={seed.anim.leftStart}
          data-left-end={seed.anim.leftEnd}
          data-rotate={seed.anim.rotate}
        />
      ))}
    </div>
  );
};

export default AnimatedSeedsBackground;
