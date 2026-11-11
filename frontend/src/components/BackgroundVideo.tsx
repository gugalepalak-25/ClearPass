import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const VIDEO_SRC = 'https://stream.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8.m3u8';
const POSTER_SRC = 'https://image.mux.com/kimF2ha9zLrX64H00UgLGPflCzNtl1T0215MlAmeOztv8/thumbnail.webp?time=2';

export const BackgroundVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Strict attributes and properties for cross-browser silent autoplay
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');

    let hls: Hls | null = null;

    const onPlaying = () => {
      setIsVideoLoaded(true);
    };
    video.addEventListener('playing', onPlaying);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = VIDEO_SRC;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((err) => {
          console.warn('[ClearPass Video] Native autoplay deferred:', err);
        });
      });
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90,
        autoStartLoad: true,
      });

      // Canonical HLS.js attachment lifecycle
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls?.loadSource(VIDEO_SRC);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => {
          console.warn('[ClearPass Video] Autoplay deferred:', err);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[ClearPass Video] Network error encountered, recovering...');
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[ClearPass Video] Media error encountered, recovering...');
              hls?.recoverMediaError();
              break;
            default:
              console.error('[ClearPass Video] Fatal HLS error:', data);
              hls?.destroy();
              break;
          }
        }
      });
    } else {
      video.src = VIDEO_SRC;
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }

    // Interaction fallback
    const tryPlay = () => {
      if (video && video.paused) {
        video.play().then(() => setIsVideoLoaded(true)).catch(() => {});
      }
    };
    window.addEventListener('click', tryPlay, { once: true });
    window.addEventListener('touchstart', tryPlay, { once: true });
    window.addEventListener('scroll', tryPlay, { once: true });

    return () => {
      video.removeEventListener('playing', onPlaying);
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
      window.removeEventListener('scroll', tryPlay);
      if (hls) {
        hls.destroy();
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Ambient background glow ensuring rich visuals even while video stream buffers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08120c] via-black to-[#050b07] -z-20" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] md:w-[1000px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-white/[0.03] to-transparent rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Fullscreen Background Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={POSTER_SRC}
        className="w-full h-full object-cover opacity-100"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 1,
        }}
      />
    </div>
  );
};
