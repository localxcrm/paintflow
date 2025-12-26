'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function Confetti({ isActive, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    // Create initial particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 8 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 3,
        speedY: 2 + Math.random() * 3,
      });
    }
    setParticles(newParticles);

    // Animation loop
    const interval = setInterval(() => {
      setParticles((prev) => {
        const updated = prev.map((p) => ({
          ...p,
          x: p.x + p.speedX,
          y: p.y + p.speedY,
          rotation: p.rotation + (Math.random() - 0.5) * 10,
          speedY: p.speedY + 0.1, // gravity
        }));

        // Check if all particles are off screen
        if (updated.every((p) => p.y > 120)) {
          clearInterval(interval);
          onComplete?.();
          return [];
        }

        return updated;
      });
    }, 16);

    // Auto cleanup after 3 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setParticles([]);
      onComplete?.();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isActive, onComplete]);

  if (!isActive && particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// Simpler celebration with emojis
export function CelebrationOverlay({
  isActive,
  onComplete,
  message = 'Parabens!',
}: {
  isActive: boolean;
  onComplete?: () => void;
  message?: string;
}) {
  useEffect(() => {
    if (isActive) {
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 mx-4 text-center animate-in zoom-in-95 duration-300">
        <div className="text-7xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{message}</h2>
        <p className="text-slate-500">Todas as tarefas concluidas!</p>
        <div className="flex justify-center gap-2 mt-4 text-4xl">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🎊</span>
          <span className="animate-bounce" style={{ animationDelay: '100ms' }}>✨</span>
          <span className="animate-bounce" style={{ animationDelay: '200ms' }}>🎉</span>
        </div>
      </div>
    </div>
  );
}
