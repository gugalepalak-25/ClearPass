import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, CheckCircle, Shield, Key, FileCheck, Layers } from 'lucide-react';
import Hls from 'hls.js';

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchScanner: () => void;
}

const DEMO_VIDEO_STREAM = 'https://stream.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8.m3u8';

export const VideoDemoModal: React.FC<VideoDemoModalProps> = ({
  isOpen,
  onClose,
  onLaunchScanner,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = DEMO_VIDEO_STREAM;
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
      });
      hls.loadSource(DEMO_VIDEO_STREAM);
      hls.attachMedia(video);
    } else {
      video.src = DEMO_VIDEO_STREAM;
    }

    const p = video.play();
    if (p !== undefined) {
      p.catch(() => {});
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="liquid-glass rounded-3xl w-full max-w-4xl overflow-hidden border border-white/15 bg-black/90 shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Play className="w-4 h-4 fill-white text-transparent" />
              </div>
              <div>
                <h3 className="text-white font-medium text-base">
                  ClearPass Protocol Demo & Walkthrough
                </h3>
                <p className="text-white/50 text-xs font-mono">
                  NEAR Testnet · Privacy-Preserving Fund Risk Assessment
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              controls
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Protocol Flow Walkthrough */}
          <div className="p-6 overflow-y-auto">
            <h4 className="text-xs uppercase tracking-wider text-white/60 font-semibold mb-4">
              How ClearPass Verifies Risk Without Exposing History
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2 text-white font-medium mb-1">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>1. Connect & Scope</span>
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  Connect NEAR testnet wallet. Assessment scopes 3 hops of native and NEP-141 transfers.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2 text-white font-medium mb-1">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>2. Graph Traversal</span>
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  Deterministic graph evaluation against real and synthetic OFAC/exploit risk datasets.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2 text-white font-medium mb-1">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>3. Cryptographic Proof</span>
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  Fastify engine signs certificate with Ed25519 keypair and anchors record on NEAR smart contract.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-2 text-white font-medium mb-1">
                  <FileCheck className="w-4 h-4 text-purple-400" />
                  <span>4. Selective Audit</span>
                </div>
                <p className="text-white/60 text-[11px] leading-relaxed">
                  Exchanges verify certificate hash and expiry instantly without viewing private wallet transactions.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-[11px] text-white/50">
                Smart Contract: <code className="text-emerald-400 font-mono">clearpass_contract.wasm</code> (Compiled & passing 19/19 tests)
              </span>
              <button
                onClick={() => {
                  onClose();
                  onLaunchScanner();
                }}
                className="liquid-glass rounded-full px-6 py-2 text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer"
              >
                Launch Risk Scanner
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
