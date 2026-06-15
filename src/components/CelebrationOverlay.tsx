import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy } from 'lucide-react';

interface CelebrationOverlayProps {
  purchasedTier: number;
  isOpen: boolean;
  onComplete: () => void;
}

export function CelebrationOverlay({ purchasedTier, isOpen, onComplete }: CelebrationOverlayProps) {
  const onCompleteRef = useRef(onComplete);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (purchasedTier <= 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onCompleteRef.current();
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';

    const dismissTimer = setTimeout(() => {
      onCompleteRef.current();
    }, 3200);

    return () => {
      clearTimeout(dismissTimer);
      document.body.style.overflow = '';
    };
  }, [isOpen, purchasedTier]);

  const appleEasing = [0.16, 1, 0.3, 1] as const;

  if (!isOpen || purchasedTier <= 1) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="celebration-bg"
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ opacity: 1, backdropFilter: 'blur(6px)' }}
        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: appleEasing }}
        className="fixed inset-0 z-[9998] bg-[#050506]/80 pointer-events-auto will-change-transform flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.7, delay: 0.1, ease: appleEasing }}
          className="relative pointer-events-auto max-w-sm w-full mx-auto"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 rounded-2xl blur-xl animate-pulse" />
          
          <div className={`relative rounded-2xl overflow-hidden backdrop-blur-2xl border ${purchasedTier >= 4 ? 'bg-[#121214]/90 border-yellow-500/30' : 'bg-[#121214]/90 border-zinc-800'} p-8 text-center shadow-2xl`}>
            <div className="flex justify-center mb-6 relative">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${purchasedTier >= 4 ? 'bg-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'bg-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.3)]'}`}>
                {purchasedTier >= 4 ? (
                  <Trophy className="w-8 h-8 text-yellow-400" />
                ) : (
                  <Sparkles className="w-8 h-8 text-emerald-400" />
                )}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">
                {purchasedTier >= 5 ? 'Elite Tier Activated' : 
                 purchasedTier === 4 ? 'Professional Clearance' : 
                 purchasedTier === 3 ? 'Advanced Access Granted' : 'Upgraded'}
              </h2>
              
              <p className="text-zinc-400 text-xs font-mono mb-6 leading-relaxed">
                System parameters updated and restrictions lifted. You now have broader access to global architecture metrics.
              </p>

              <div className="inline-block bg-black/50 border border-zinc-800 rounded-lg px-4 py-2 text-[10px] font-bold text-white uppercase tracking-widest animate-[pulse_2s_ease-in-out_infinite]">
                Initializing New Modules...
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
