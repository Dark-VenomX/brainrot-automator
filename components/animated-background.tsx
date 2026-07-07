'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

export function AnimatedBackground() {
  const pathname = usePathname();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? (theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) : true;
  const isWorkspace = pathname?.startsWith('/workspace');

  useEffect(() => {
    if (isWorkspace) return;

    // ===================== SCROLL VIDEO (FLORAL) =====================
    const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260616_212935_bbf608da-62d1-4f25-9be4-c346e4d09cc8.mp4';
    const canvas = document.getElementById('video-canvas') as HTMLCanvasElement;
    const videoEl = document.getElementById('video-fallback') as HTMLVideoElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frames: ImageBitmap[] = [];
    let framesReady = false;
    let lastFrameIndex = -1;
    let videoSeeking = false;
    let animationFrameId: number;
    let pAnimId: number;

    function resizeCanvas() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      lastFrameIndex = -1;
    }

    async function extractFrames() {
      try {
        const response = await fetch(VIDEO_URL, { mode: 'cors' });
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';
        video.src = objectUrl;

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject();
          setTimeout(() => reject(), 15000);
        });

        const scale = Math.min(1, 1280 / video.videoWidth);
        const scaledWidth = Math.round(video.videoWidth * scale);
        const scaledHeight = Math.round(video.videoHeight * scale);
        const frameCount = Math.max(30, Math.min(120, Math.round(video.duration * 24)));

        for (let i = 0; i < frameCount; i++) {
          const time = (i / (frameCount - 1)) * (video.duration - 0.05);
          video.currentTime = time;
          await new Promise<void>((resolve, reject) => {
            const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve(); };
            video.addEventListener('seeked', onSeeked);
            setTimeout(() => { video.removeEventListener('seeked', onSeeked); resolve(); }, 1000);
          });
          
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = scaledWidth;
          tempCanvas.height = scaledHeight;
          const tCtx = tempCanvas.getContext('2d');
          if (tCtx) {
            tCtx.drawImage(video, 0, 0, scaledWidth, scaledHeight);
            const bitmap = await createImageBitmap(tempCanvas);
            frames.push(bitmap);
          }
        }
        
        framesReady = true;
        URL.revokeObjectURL(objectUrl);
        if (videoEl) {
          videoEl.style.display = 'none';
          videoEl.pause();
        }
      } catch (err) {
        console.warn("Frame extraction failed, using video fallback", err);
        framesReady = false;
        if (videoEl) {
          videoEl.style.opacity = '1';
          videoEl.style.display = 'block';
          videoEl.play().catch(e => console.warn("Video playback blocked", e));
        }
      }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    extractFrames();

    function renderFrame() {
      if (!canvas || !ctx || !framesReady || frames.length === 0) return;
      
      const scrollY = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollProgress = Math.max(0, Math.min(1, scrollY / maxScroll));
      const targetFrame = Math.floor(scrollProgress * (frames.length - 1));
      
      if (targetFrame !== lastFrameIndex) {
        const frame = frames[targetFrame];
        
        const canvasRatio = canvas.width / canvas.height;
        const frameRatio = frame.width / frame.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (canvasRatio > frameRatio) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / frameRatio;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * frameRatio;
          drawHeight = canvas.height;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        }
        
        ctx.fillStyle = '#06040A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frame, drawX, drawY, drawWidth, drawHeight);
        lastFrameIndex = targetFrame;
      }
    }

    function loop() {
      if (framesReady) renderFrame();
      animationFrameId = requestAnimationFrame(loop);
    }
    loop();

    // Fallback sync logic
    const onSeeked = () => { videoSeeking = false; };
    const onStalled = () => { videoSeeking = false; };
    const onLoadedData = () => { videoSeeking = false; };
    
    if (videoEl) {
      videoEl.addEventListener('seeked', onSeeked);
      videoEl.addEventListener('stalled', onStalled);
      videoEl.addEventListener('loadeddata', onLoadedData);
      
      const updateVideoSync = () => {
        if (framesReady || videoSeeking) return;
        const scrollY = window.scrollY;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const scrollProgress = Math.max(0, Math.min(1, scrollY / maxScroll));
        if (videoEl.duration) {
          const targetTime = scrollProgress * (videoEl.duration - 0.1);
          if (Math.abs(videoEl.currentTime - targetTime) > 0.1) {
            videoSeeking = true;
            videoEl.currentTime = targetTime;
          }
        }
      };
      window.addEventListener('scroll', updateVideoSync, { passive: true });
    }

    // Particles
    const pCanvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
    const pCtx = pCanvas?.getContext('2d');
    let particles: {x: number, y: number, vx: number, vy: number, size: number, opacity: number}[] = [];

    function resizeParticles() {
      if (!pCanvas) return;
      pCanvas.width = window.innerWidth;
      pCanvas.height = window.innerHeight;
      particles = [];
      const count = Math.floor((pCanvas.width * pCanvas.height) / 12000);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * pCanvas.width,
          y: Math.random() * pCanvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.6 + 0.2
        });
      }
    }

    function animateParticles() {
      if (!pCanvas || !pCtx) return;
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      const isDk = document.documentElement.classList.contains('dark');
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = pCanvas.width;
        if (p.x > pCanvas.width) p.x = 0;
        if (p.y < 0) p.y = pCanvas.height;
        if (p.y > pCanvas.height) p.y = 0;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pCtx.fillStyle = isDk ? `rgba(255,255,255,${p.opacity})` : `rgba(0,0,0,${p.opacity * 0.5})`;
        pCtx.fill();
      }
      pAnimId = requestAnimationFrame(animateParticles);
    }

    if (pCanvas) {
      resizeParticles();
      window.addEventListener('resize', resizeParticles);
      animateParticles();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      cancelAnimationFrame(pAnimId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('resize', resizeParticles);
      if (videoEl) {
        videoEl.removeEventListener('seeked', onSeeked);
        videoEl.removeEventListener('stalled', onStalled);
        videoEl.removeEventListener('loadeddata', onLoadedData);
      }
    };
  }, [isWorkspace]);

  if (isWorkspace) {
    // Modern abstract tech background
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-500">
        <div className={`absolute inset-0 transition-opacity duration-700 ${isDark ? 'opacity-100 bg-[#0F0A19]' : 'opacity-0 bg-slate-50'}`} />
        <div className={`absolute inset-0 transition-opacity duration-700 ${!isDark ? 'opacity-100 bg-slate-50' : 'opacity-0'}`} />
        
        {/* Glow orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full mix-blend-screen filter blur-[100px] bg-purple-500/20 animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full mix-blend-screen filter blur-[120px] bg-cyan-500/20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full mix-blend-screen filter blur-[100px] bg-fuchsia-500/20 animate-blob animation-delay-4000" />
        
        <div className={`absolute inset-0 opacity-[0.03] ${isDark ? 'bg-[url(/noise.svg)]' : ''} bg-repeat`} style={{ backgroundSize: '100px 100px' }} />
      </div>
    );
  }

  // Landing page background (Floral)
  return (
    <>
      <div id="scroll-video-container" className="fixed inset-0 z-0 top-[-20%] transition-colors duration-500" style={{ background: isDark ? '#06040A' : '#f8fafc' }}>
        <div 
          className="absolute inset-0 transition-all duration-1000"
          style={{ 
            filter: isDark ? 'none' : 'grayscale(1) invert(1) contrast(1.1) brightness(1.1)' 
          }}
        >
          <canvas id="video-canvas" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}></canvas>
          <video id="video-fallback" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260616_212935_bbf608da-62d1-4f25-9be4-c346e4d09cc8.mp4" muted playsInline crossOrigin="anonymous" preload="auto" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}></video>
        </div>
        
        {/* Dynamic overlay based on theme */}
        <div className={`absolute inset-0 transition-all duration-1000 ${isDark ? 'bg-[#06040A]/60' : 'bg-slate-50/40 backdrop-blur-[2px]'}`}></div>
      </div>
      <canvas id="particles-canvas" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}></canvas>
    </>
  );
}
