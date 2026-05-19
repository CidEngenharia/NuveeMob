import React from 'react';
import { motion } from 'motion/react';
import { Cloud, Smartphone, Monitor } from 'lucide-react';

function Typewriter({ text, speed = 80, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [displayedText, setDisplayedText] = React.useState('');

  React.useEffect(() => {
    let timeoutId: any;
    let index = 0;

    const startTyping = () => {
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, speed);
      return interval;
    };

    let intervalId: any;
    if (delay > 0) {
      timeoutId = setTimeout(() => {
        intervalId = startTyping();
      }, delay);
    } else {
      intervalId = startTyping();
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, speed, delay]);

  return (
    <span>
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "steps(2)" }}
        style={{ 
          display: 'inline-block', 
          width: '2px', 
          height: '1em', 
          backgroundColor: 'currentColor', 
          marginLeft: '2px', 
          verticalAlign: 'middle' 
        }}
      />
    </span>
  );
}

const ORBIT_R = 148;      // raio do anel orbital
const ICON_W  = 54;       // largura do ícone
const ICON_H  = 74;       // ícone + label
const CLOUD_D = 124;      // diâmetro do círculo central
const TEXT_COLOR = 'rgba(148,163,184,0.82)'; // cor compartilhada

export function SplashScreen() {
  const [isDesktop, setIsDesktop] = React.useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Largura total da composição: 2 * (ORBIT_R + ICON_W/2 + 24)
  const compW = 2 * (ORBIT_R + ICON_W / 2 + 24); // ≈ 452
  const compH = ORBIT_R * 2;                       // ≈ 296

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #0d1b3e 0%, #060d1f 60%, #020509 100%)',
        position: 'relative',
        overflow: 'hidden',
        gap: isDesktop ? 48 : 28,
      }}
    >
      {/* Glow difuso centralizado */}
      <div
        style={{
          position: 'absolute',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.14) 0%, rgba(99,102,241,0.05) 55%, transparent 80%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo no topo da janela (canto superior esquerdo) */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 24, 
          left: 24, 
          zIndex: 50,
          opacity: 0.9
        }}
      >
        <img 
          src="/nuvem_mob.png" 
          alt="NuveeMob Logo" 
          style={{ 
            height: 28, 
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.2))'
          }} 
        />
      </div>

      {/* Container Principal: Responsivo (Lado a Lado no Desktop, Empilhado no Mobile) */}
      <div
        style={{
          display: 'flex',
          flexDirection: isDesktop ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isDesktop ? 40 : 20,
          zIndex: 10,
        }}
      >
        {/* Texto da Esquerda / Superior (Lilás) */}
        <div 
          style={{ 
            width: isDesktop ? 260 : 'auto', 
            textAlign: isDesktop ? 'right' : 'center',
            color: '#c084fc', // Lilás premium
            fontSize: isDesktop ? '1.25rem' : '1.15rem', 
            fontWeight: 500, 
            letterSpacing: '0.04em',
            margin: 0,
            minHeight: '1.75rem'
          }}
        >
          <Typewriter text="Conectar seus dispositivos," speed={60} delay={300} />
        </div>

        {/* ======= COMPOSIÇÃO ORBITAL ======= */}
        {/*
          compW × compH — a composição total.
          O anel (diâmetro = ORBIT_R*2) ocupa o centro exato desse container.
          Os ícones são posicionados nas bordas esquerda/direita do anel.
        */}
        <div style={{ position: 'relative', width: compW, height: compH, flexShrink: 0 }}>

          {/* Centro absoluto da composição */}
          {/* cx = compW / 2,  cy = compH / 2 */}

          {/* ── Anel orbital estático ── */}
          <div
            style={{
              position: 'absolute',
              width: ORBIT_R * 2,
              height: ORBIT_R * 2,
              top: 0,
              left: compW / 2 - ORBIT_R,
              borderRadius: '50%',
              border: '1.5px solid rgba(99,102,241,0.28)',
              boxShadow: '0 0 30px 3px rgba(99,102,241,0.1)',
            }}
          />

          {/* ── Anel girando sentido horário ── */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: ORBIT_R * 2 + 6,
              height: ORBIT_R * 2 + 6,
              top: -3,
              left: compW / 2 - ORBIT_R - 3,
              borderRadius: '50%',
              border: '2.5px solid transparent',
              borderTopColor: '#60a5fa',
              borderRightColor: 'rgba(96,165,250,0.22)',
              boxShadow: '0 0 18px 2px rgba(96,165,250,0.28)',
            }}
          />

          {/* ── Anel girando anti-horário ── */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: ORBIT_R * 2 - 24,
              height: ORBIT_R * 2 - 24,
              top: 12,
              left: compW / 2 - ORBIT_R + 12,
              borderRadius: '50%',
              border: '1.5px solid transparent',
              borderBottomColor: 'rgba(167,139,250,0.4)',
              borderLeftColor: 'rgba(167,139,250,0.15)',
            }}
          />

          {/* ── Bolinha teal-azulada girando ── */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: ORBIT_R * 2 + 6,
              height: ORBIT_R * 2 + 6,
              top: -3,
              left: compW / 2 - ORBIT_R - 3,
              borderRadius: '50%',
            }}
          >
            {/* Ponto no topo do anel = início da rotação */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#2dd4bf',           // verde-azulado (teal)
                boxShadow: '0 0 10px 4px rgba(45,212,191,0.55)',
              }}
            />
          </motion.div>

          {/* ── ÍCONE SMARTPHONE — 9h (esquerda exata do anel) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
            style={{
              position: 'absolute',
              top: compH / 2 - ICON_H / 2,
              left: compW / 2 - ORBIT_R - ICON_W / 2 - 16,
            }}
          >
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <div
                style={{
                  width: ICON_W,
                  height: ICON_W,
                  borderRadius: 14,
                  background: 'rgba(99,102,241,0.18)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(99,102,241,0.35)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Smartphone size={26} color="#a78bfa" />
              </div>
              <span style={{ fontSize: 10, color: '#a78bfa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Mobile
              </span>
            </motion.div>
          </motion.div>

          {/* ── ÍCONE MONITOR — 3h (direita exata do anel) ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5, type: 'spring' }}
            style={{
              position: 'absolute',
              top: compH / 2 - ICON_H / 2,
              left: compW / 2 + ORBIT_R - ICON_W / 2 + 16,
            }}
          >
            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <div
                style={{
                  width: ICON_W,
                  height: ICON_W,
                  borderRadius: 14,
                  background: 'rgba(59,130,246,0.18)',
                  border: '1px solid rgba(59,130,246,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(59,130,246,0.35)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Monitor size={26} color="#60a5fa" />
              </div>
              <span style={{ fontSize: 10, color: '#60a5fa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Desktop
              </span>
            </motion.div>
          </motion.div>

          {/* ── CENTRO — Nuvem pulsante + NuveeMob ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, type: 'spring', stiffness: 120 }}
            style={{
              position: 'absolute',
              top: compH / 2 - CLOUD_D / 2,
              left: compW / 2 - CLOUD_D / 2,
              width: CLOUD_D,
              height: CLOUD_D,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.38) 0%, rgba(17,24,39,0.92) 70%)',
              border: '1.5px solid rgba(96,165,250,0.4)',
              boxShadow: '0 0 44px rgba(59,130,246,0.35), inset 0 0 32px rgba(59,130,246,0.1)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              zIndex: 10,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.16, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Cloud size={36} color="#93c5fd" strokeWidth={1.5} />
            </motion.div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#e0f2fe', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              NuveeMob
            </span>
          </motion.div>
        </div>

        {/* Texto da Direita / Inferior (Lilás) */}
        {isDesktop && (
          <div 
            style={{ 
              width: 260, 
              textAlign: 'left',
              color: '#c084fc', // Lilás premium
              fontSize: '1.25rem', 
              fontWeight: 500, 
              letterSpacing: '0.04em',
              margin: 0,
              minHeight: '1.75rem'
            }}
          >
            <Typewriter text="agora ficou mais fácil." speed={60} delay={2200} />
          </div>
        )}
      </div>

      {/* ======= TEXTOS E CREDITOS — abaixo da animação ======= */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 10 }}>
        {!isDesktop && (
          <p style={{ fontSize: '1.05rem', color: '#c084fc', letterSpacing: '0.04em', margin: 0, minHeight: '1.5rem', textAlign: 'center' }}>
            <Typewriter text="agora ficou mais fácil." speed={60} delay={2200} />
          </p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 11, color: TEXT_COLOR, letterSpacing: '0.12em', margin: 0, marginTop: isDesktop ? 16 : 12 }}
        >
          iniciando nuveemob...
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 3.5, duration: 0.8 }}
          style={{ fontSize: 10, color: TEXT_COLOR, letterSpacing: '0.05em', margin: 0 }}
        >
          Developer — CidEngenharia — Sidney Sales
        </motion.p>
      </div>
    </div>
  );
}
