import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Play, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';

interface HeroProps {
  onStartScan?: (accountId?: string) => void;
  onOpenDemoVideo?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onStartScan,
  onOpenDemoVideo,
  onNavigateTab,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [placeholderText, setPlaceholderText] = useState('');

  const defaultPlaceholder = 'Enter NEAR Account (e.g. alice.testnet)';
  const submittedPlaceholder = 'Verification pass sent! Redirecting to scanner...';

  // Typewriter effect
  useEffect(() => {
    if (!formOpen) {
      setPlaceholderText('');
      return;
    }

    const targetText = isSubmitted ? submittedPlaceholder : defaultPlaceholder;
    let currentIndex = 0;
    setPlaceholderText('');

    const interval = setInterval(() => {
      if (currentIndex <= targetText.length) {
        setPlaceholderText(targetText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [formOpen, isSubmitted]);

  // Reset back to button state after 4 seconds post-submit
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        if (inputValue.trim() && onStartScan) {
          onStartScan(inputValue.trim());
        }
        setIsSubmitted(false);
        setFormOpen(false);
        setInputValue('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, inputValue, onStartScan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setIsSubmitted(true);
  };

  return (
    <section className="relative flex-1 flex flex-col items-center justify-center px-6">
      <div className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center justify-center w-full gap-8 md:gap-10">
        
        {/* Top Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-white/90" />
            <span className="text-white/80 text-[10px] md:text-[11px] font-medium tracking-[0.2em] uppercase">
              PRIVACY-PRESERVING FUND RISK VERIFICATION ON NEAR
            </span>
          </div>
        </motion.div>

        {/* Heading in Instrument Serif */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: "'Instrument Serif', serif" }}
          className="text-4xl md:text-[68px] font-normal tracking-[-0.01em] leading-[1.08] bg-gradient-to-b from-white via-white/95 to-white/70 bg-clip-text text-transparent max-w-4xl"
        >
          Prove your money is clean,
          <br className="hidden md:block" />
          {' '}without showing anyone your history.
        </motion.h1>

        {/* Supporting description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.9 }}
          className="text-white/70 text-sm md:text-base max-w-2xl font-light tracking-wide leading-relaxed -mt-2"
        >
          ClearPass scans NEAR native and NEP-141 transactions across up to 3 hops against known risk lists, generating tamper-proof on-chain verification certificates with selective zero-knowledge auditor disclosure.
        </motion.p>

        {/* CTA Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="min-h-[50px] mt-2 flex flex-col items-center justify-center w-full"
        >
          <AnimatePresence mode="wait">
            {!formOpen ? (
              <motion.button
                key="btn-state"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setFormOpen(true)}
                className="px-10 py-3 text-[14px] font-medium border border-white/10 rounded-full hover:border-white/30 hover:bg-white/[0.04] transition-all duration-300 text-white/90 backdrop-blur-sm cursor-pointer shadow-lg shadow-black/40 flex items-center gap-2 group"
              >
                <span>Get early access & scan wallet</span>
                <ArrowRight className="w-4 h-4 text-white/60 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            ) : (
              <motion.form
                key="form-state"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="flex items-center gap-2 pl-5 pr-1.5 py-1.5 text-[14px] font-medium border border-white/20 rounded-full bg-white/[0.03] backdrop-blur-md w-full max-w-[360px] focus-within:border-white/50 transition-colors duration-300 shadow-2xl"
              >
                <input
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={placeholderText}
                  disabled={isSubmitted}
                  className="bg-transparent text-white placeholder-white/45 text-[13px] md:text-[14px] outline-none flex-1 min-w-0"
                />
                <button
                  type="submit"
                  disabled={isSubmitted || !inputValue.trim()}
                  className="liquid-glass rounded-full w-8 h-8 flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
                  aria-label="Submit"
                >
                  {isSubmitted ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-white" />
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Video Demo Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex items-center gap-6"
        >
          <button
            onClick={() => onOpenDemoVideo ? onOpenDemoVideo() : (onNavigateTab && onNavigateTab('scanner'))}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-300 text-[13px] font-medium tracking-wide cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white/80 text-transparent" />
            <span>Play Video Demo & Risk Walkthrough</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('scanner')}
              className="hidden sm:inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors duration-300 text-[13px] font-normal"
            >
              <span>Launch Live Scanner</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </motion.div>

      </div>
    </section>
  );
};

