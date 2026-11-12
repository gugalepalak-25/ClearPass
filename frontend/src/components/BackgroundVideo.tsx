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
        video.play().catch(() => {});
      });
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90,
        autoStartLoad: true,
      });

      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls?.loadSource(VIDEO_SRC);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
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

    const tryPlay = () => {
      if (video && video.paused) {
        video.play().then(() => setIsVideoLoaded(true)).catch(() => {});
      }
    };
    window.addEventListener('click', tryPlay, { once: true });
    window.addEventListener('touchstart', tryPlay, { once: true });

    return () => {
      video.removeEventListener('playing', onPlaying);
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
      if (hls) {
        hls.destroy();
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep Obsidian Space Backdrop */}
      <div className="absolute inset-0 bg-[#030712] -z-30" />

      {/* Cyber Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.14] -z-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 60%, transparent 100%)',
        }}
      />

      {/* Radiant Aurora Mesh Glows in Cyber-Purple */}
      <div className="absolute top-[-10%] left-[-5%] w-[650px] h-[550px] bg-gradient-to-br from-purple-600/30 via-violet-600/20 to-transparent rounded-full blur-[140px] animate-pulse duration-7000 -z-20" />
      <div className="absolute top-[20%] right-[-10%] w-[700px] h-[600px] bg-gradient-to-bl from-fuchsia-600/25 via-indigo-600/20 to-transparent rounded-full blur-[150px] -z-20" />
      <div className="absolute bottom-[-15%] left-[25%] w-[600px] h-[500px] bg-gradient-to-t from-violet-600/25 via-purple-500/15 to-transparent rounded-full blur-[160px] -z-20" />

      {/* Mux HLS Background Video with Holographic blend */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={POSTER_SRC}
        className="w-full h-full object-cover opacity-80 mix-blend-screen -z-15"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Subtle top & bottom vignette to frame the content */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/70 via-transparent to-[#030712]/90 pointer-events-none -z-10" />
    </div>
  );
};
