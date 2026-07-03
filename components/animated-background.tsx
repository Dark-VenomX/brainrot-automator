'use client';

import { useEffect } from 'react';

export function AnimatedBackground() {
  useEffect(() => {
    // ===================== SCROLL VIDEO =====================
    const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260616_212935_bbf608da-62d1-4f25-9be4-c346e4d09cc8.mp4';
    const canvas = document.getElementById('video-canvas') as HTMLCanvasElement;
    const videoEl = document.getElementById('video-fallback') as HTMLVideoElement;
    const ctx = canvas?.getContext('2d');
    let frames: ImageBitmap[] = [];
    let framesReady = false;
    let lastFrameIndex = -1;
    let videoSeeking = false;
    let animationFrameId: number;

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
            setTimeout(() => { video.removeEventListener('seeked', onSeeked); reject(); }, 3000);
          });
          const bitmap = await createImageBitmap(video, { resizeWidth: scaledWidth, resizeHeight: scaledHeight });
          frames.push(bitmap);
        }

        if (frames.length > 0 && canvas && videoEl) {
          framesReady = true;
          canvas.style.visibility = 'visible';
          videoEl.style.display = 'none';
        }
        URL.revokeObjectURL(objectUrl);
      } catch(e) { /* fallback to video seeking */ }
    }

    function getScrollBounds() {
      const vh = window.innerHeight;
      return { start: vh * 0.5, end: document.documentElement.scrollHeight - vh };
    }

    function getProgress() {
      const { start, end } = getScrollBounds();
      const range = end - start;
      if (range <= 0) return 0;
      return Math.max(0, Math.min(1, (window.scrollY - start) / range));
    }

    function drawFrame(frame: ImageBitmap) {
      if (!canvas || !ctx) return;
      const cw = canvas.width, ch = canvas.height;
      const s = Math.max(cw / frame.width, ch / frame.height);
      const dw = frame.width * s, dh = frame.height * s;
      ctx.drawImage(frame, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }

    function videoTick() {
      if (!canvas || !videoEl) return;
      const progress = getProgress();
      if (framesReady && frames.length > 0) {
        const idx = Math.round(progress * (frames.length - 1));
        if (idx !== lastFrameIndex) {
          lastFrameIndex = idx;
          if (frames[idx]) drawFrame(frames[idx]);
        }
      } else if (videoEl.duration && isFinite(videoEl.duration) && videoEl.readyState >= 1) {
        const target = progress * videoEl.duration;
        if (!videoSeeking && Math.abs(videoEl.currentTime - target) > 0.001) {
          videoSeeking = true;
          videoEl.currentTime = target;
        }
      }
      animationFrameId = requestAnimationFrame(videoTick);
    }

    const onSeeked = () => { videoSeeking = false; };
    const onStalled = () => { videoSeeking = false; };
    const onLoadedData = () => { if (videoEl) videoEl.currentTime = 0; };

    if (videoEl) {
      videoEl.addEventListener('seeked', onSeeked);
      videoEl.addEventListener('stalled', onStalled);
      videoEl.addEventListener('loadeddata', onLoadedData);
    }
    
    if (canvas) {
      canvas.style.visibility = 'hidden';
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      animationFrameId = requestAnimationFrame(videoTick);
      extractFrames();
    }


    // ===================== PARTICLES =====================
    const pCanvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
    const pCtx = pCanvas?.getContext('2d');
    let particles: any[] = [];
    let pAnimId: number;

    function resizeParticles() {
      if (!pCanvas) return;
      pCanvas.width = window.innerWidth;
      pCanvas.height = window.innerHeight;
      createParticles();
    }

    function createParticles() {
      if (!pCanvas) return;
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
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = pCanvas.width;
        if (p.x > pCanvas.width) p.x = 0;
        if (p.y < 0) p.y = pCanvas.height;
        if (p.y > pCanvas.height) p.y = 0;
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(255,255,255,${p.opacity})`;
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
  }, []);

  return (
    <>
      <div id="scroll-video-container" style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#06040A', top: '-20%' }}>
        <canvas id="video-canvas" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}></canvas>
        <video id="video-fallback" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260616_212935_bbf608da-62d1-4f25-9be4-c346e4d09cc8.mp4" muted playsInline crossOrigin="anonymous" preload="auto" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}></video>
        <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(6, 4, 10, 0.4)' }}></div>
      </div>
      <canvas id="particles-canvas" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}></canvas>
    </>
  );
}
