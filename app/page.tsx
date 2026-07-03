'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function VeldaraLandingPage() {
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

    // ===================== HERO FADE =====================
    function updateHeroOpacity() {
      const hero = document.getElementById('hero');
      if (hero) {
        const fade = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.3));
        hero.style.opacity = fade.toString();
      }
    }
    window.addEventListener('scroll', updateHeroOpacity, { passive: true });

    // ===================== FIXED CARDS =====================
    const fixedCards = document.getElementById('fixed-cards');
    const cardsGrid = fixedCards?.querySelector('.grid') as HTMLElement;
    let cardsAnimId: number;

    function tickCards() {
      const trigger = document.getElementById('cards-trigger');
      if (!trigger || !fixedCards || !cardsGrid) return;
      
      const rect = trigger.getBoundingClientRect();
      const triggerTop = rect.top + window.scrollY;
      const triggerHeight = rect.height;
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      const start = triggerTop - vh * 0.5;
      const end = triggerTop + triggerHeight - vh * 0.3;
      const range = end - start;

      let progress = range > 0 ? (scrollY - start) / range : 0;
      progress = Math.max(0, Math.min(1, progress));

      const isActive = scrollY >= start - vh * 0.2 && scrollY <= end + vh * 0.3;
      const fadeIn = Math.min(1, Math.max(0, (scrollY - (start - vh * 0.2)) / (vh * 0.2)));
      const fadeOut = Math.min(1, Math.max(0, (end + vh * 0.3 - scrollY) / (vh * 0.3)));
      const containerOpacity = isActive ? Math.min(fadeIn, fadeOut) : 0;

      fixedCards.style.opacity = containerOpacity.toString();
      fixedCards.style.pointerEvents = containerOpacity > 0.1 ? 'auto' : 'none';

      const isMobile = window.innerWidth < 768;
      const revealPct = progress * 130;
      if (isMobile) {
        cardsGrid.style.maskImage = `linear-gradient(to bottom, black ${revealPct}%, transparent ${revealPct + 20}%)`;
        cardsGrid.style.webkitMaskImage = `linear-gradient(to bottom, black ${revealPct}%, transparent ${revealPct + 20}%)`;
      } else {
        cardsGrid.style.maskImage = `linear-gradient(to right, black ${revealPct}%, transparent ${revealPct + 15}%)`;
        cardsGrid.style.webkitMaskImage = `linear-gradient(to right, black ${revealPct}%, transparent ${revealPct + 15}%)`;
      }

      cardsAnimId = requestAnimationFrame(tickCards);
    }
    
    if (fixedCards) {
      cardsAnimId = requestAnimationFrame(tickCards);
    }

    // ===================== SECTION 3 INTERSECTION =====================
    const sectionThreeInner = document.getElementById('section-three-inner');
    let observer: IntersectionObserver;
    if (sectionThreeInner) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          sectionThreeInner.classList.add('visible');
          if (observer) observer.unobserve(sectionThreeInner);
        }
      }, { threshold: 0.15 });
      observer.observe(sectionThreeInner);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      cancelAnimationFrame(pAnimId);
      cancelAnimationFrame(cardsAnimId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('resize', resizeParticles);
      window.removeEventListener('scroll', updateHeroOpacity);
      if (videoEl) {
        videoEl.removeEventListener('seeked', onSeeked);
        videoEl.removeEventListener('stalled', onStalled);
        videoEl.removeEventListener('loadeddata', onLoadedData);
      }
      if (observer && sectionThreeInner) {
        observer.unobserve(sectionThreeInner);
      }
    };
  }, []);

  return (
    <div className="veldara-theme">
      <style dangerouslySetInnerHTML={{ __html: `
        .veldara-theme {
          font-family: var(--font-inter), 'Inter', sans-serif; 
          background: #06040A; 
          color: #fff;
          min-height: 100vh;
        }
        .veldara-theme .fixed { position: fixed; }
        .veldara-theme .absolute { position: absolute; }
        .veldara-theme .relative { position: relative; }
        .veldara-theme .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }

        /* Scroll Video */
        #scroll-video-container {
          position: fixed; inset: 0; z-index: 0;
          background: #06040A; top: -20%;
        }
        #scroll-video-container canvas,
        #scroll-video-container video {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
        }
        #scroll-video-container .overlay { position: absolute; inset: 0; background: rgba(6, 4, 10, 0.4); }

        /* Particles */
        #particles-canvas {
          position: fixed; inset: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 3;
        }

        /* Nav */
        .veldara-theme nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 2.5rem;
          background: linear-gradient(to bottom, rgba(6,4,10,0.8), transparent);
          backdrop-filter: blur(4px);
        }
        .veldara-theme nav .logo { font-weight: 700; font-size: 1.25rem; color: #fff; letter-spacing: -0.025em; text-transform: lowercase; }
        .veldara-theme nav .nav-links { display: flex; align-items: center; gap: 2rem; }
        .veldara-theme nav .nav-links a { font-size: 0.875rem; color: #9ca3af; text-decoration: none; transition: color 0.2s; font-weight: 500; }
        .veldara-theme nav .nav-links a:hover { color: #A855F7; }
        .veldara-theme nav .social { display: flex; align-items: center; gap: 1rem; }
        .veldara-theme nav .social a { color: #9ca3af; transition: color 0.2s; }
        .veldara-theme nav .social a:hover { color: #06B6D4; }
        .veldara-theme nav .social svg { width: 1.25rem; height: 1.25rem; }

        /* Hero */
        #hero {
          position: relative; height: 100vh; width: 100%; display: flex; flex-direction: column;
        }
        #hero .gradient-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, #06040A 10%, transparent 80%);
        }
        #hero .content {
          position: relative; z-index: 10; flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: flex-end; text-align: center;
          padding: 0 1.5rem 6rem;
        }
        #hero .subtitle { font-size: 0.875rem; color: #a855f7; margin-bottom: 1rem; letter-spacing: 0.1em; font-weight: 600; text-transform: uppercase; }
        #hero h1 { font-size: clamp(2rem, 6vw, 4rem); font-weight: 700; line-height: 1.15; max-width: 52rem; letter-spacing: -0.02em; }
        #hero h1 .underlined {
          position: relative; display: inline-block;
        }
        #hero h1 .underlined .line {
          position: absolute; bottom: 0.15rem; left: 0; width: 100%; height: 8px;
          background: linear-gradient(90deg, #A855F7, #06B6D4); border-radius: 4px;
          opacity: 0.8;
        }
        #hero h1 .underlined span { position: relative; z-index: 1; }
        #hero .ctas {
          display: flex; align-items: center; gap: 1rem; margin-top: 2.5rem; flex-wrap: wrap; justify-content: center;
        }
        #hero .code-box {
          display: flex; align-items: center; gap: 0.75rem;
          background: rgba(16, 12, 24, 0.6); border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 0.5rem; padding: 0.875rem 1.5rem; backdrop-filter: blur(8px);
        }
        #hero .code-box .prompt { color: #06B6D4; font-family: monospace; font-size: 0.875rem; font-weight: bold; }
        #hero .code-box code { font-size: 0.875rem; color: #e5e7eb; font-family: monospace; }
        #hero .cta-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: linear-gradient(135deg, #A855F7, #7C3AED); color: #fff; font-weight: 600; border-radius: 0.5rem;
          padding: 0.875rem 2rem; font-size: 0.875rem; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(168, 85, 247, 0.3);
        }
        #hero .cta-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(168, 85, 247, 0.5); }
        #hero .bounce-arrow {
          position: relative; z-index: 10; display: flex; justify-content: center; padding-bottom: 2rem;
        }
        #hero .bounce-arrow svg { width: 1.5rem; height: 1.5rem; color: #a855f7; animation: bounce 1s infinite; }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-25%); }
        }

        /* Cards */
        #fixed-cards {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 4;
          padding: 3rem 2.5rem; opacity: 0; pointer-events: none;
        }
        #fixed-cards .grid {
          max-width: 72rem; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5rem;
        }
        #fixed-cards .card {
          background: rgba(15, 10, 25, 0.4);
          border: 1px solid rgba(168, 85, 247, 0.15);
          padding: 2rem;
          border-radius: 0.75rem;
          backdrop-filter: blur(12px);
        }
        #fixed-cards .card h3 { font-size: 1.35rem; font-weight: 700; color: #fff; margin-bottom: 1rem; letter-spacing: -0.01em; }
        #fixed-cards .card p { color: #9ca3af; font-size: 0.9rem; line-height: 1.6; }

        /* Section 3 */
        #section-three {
          position: relative; min-height: 100vh; display: flex; align-items: flex-end;
          justify-content: center; padding: 0 2.5rem 8rem;
        }
        #section-three .inner {
          position: relative; z-index: 10; display: flex; flex-direction: column;
          align-items: center; text-align: center;
          opacity: 0; transform: translateY(32px); filter: blur(8px);
          transition: opacity 1s ease-out, transform 1s ease-out, filter 1s ease-out;
        }
        #section-three .inner.visible { opacity: 1; transform: translateY(0); filter: blur(0); }
        #section-three .inner p { color: #06B6D4; font-size: 1rem; margin-bottom: 0.75rem; font-weight: 600; letter-spacing: 0.05em; }
        #section-three .inner h2 { font-size: clamp(2.5rem, 7vw, 5rem); font-weight: 800; background: linear-gradient(135deg, #fff 40%, #A855F7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        /* Content wrapper */
        #content { position: relative; z-index: 2; }

        /* Responsive */
        @media (max-width: 768px) {
          .veldara-theme nav { padding: 1rem 1.5rem; }
          .veldara-theme nav .nav-links { display: none; }
          #hero .content { padding-bottom: 5rem; }
          #hero h1 { font-size: 1.75rem; }
          #hero .ctas { flex-direction: column; width: 100%; }
          #hero .code-box, #hero .cta-btn { width: 100%; justify-content: center; }
          #fixed-cards .grid { grid-template-columns: 1fr; gap: 1rem; }
          #fixed-cards { padding: 1.5rem 1rem; }
          #section-three { padding-bottom: 5rem; }
        }
      `}} />

      {/* Scroll Video Background */}
      <div id="scroll-video-container">
        <canvas id="video-canvas"></canvas>
        <video id="video-fallback" muted playsInline preload="auto" crossOrigin="anonymous"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260616_212935_bbf608da-62d1-4f25-9be4-c346e4d09cc8.mp4"
        ></video>
        <div className="overlay"></div>
      </div>

      {/* Particles */}
      <canvas id="particles-canvas"></canvas>

      {/* Fixed Cards */}
      <div id="fixed-cards">
        <div className="grid">
          <div className="card">
            <h3>Explore Brainrot AI</h3>
            <p>Brainrot AI merges the elegance of automation with the depth of viral algorithms within easy reach. It's crafted to be robust and adaptable while remaining intuitive and simple to grasp.</p>
          </div>
          <div className="card">
            <h3>Unlock Growth</h3>
            <p>The digital space is growing increasingly competitive. At its heart, Brainrot AI offers a powerful pipeline for building viral shorts and scheduling them autonomously.</p>
          </div>
          <div className="card">
            <h3>Connect Everything</h3>
            <p>Brainrot AI ships with tooling for video generation, voiceovers, scheduling, dynamic captions, and extensive utilities to make building compelling short-form content effortless.</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span className="logo">brainrot.ai</span>
          <div className="nav-links">
            <a href="#hero">Features</a>
            <a href="#cards-trigger">Pipeline</a>
            <a href="#section-three">Pricing</a>
            <a href="#">Docs</a>
          </div>
        </div>
        <div className="social">
          <Link href="/workspace" className="bg-white text-black px-4 py-1.5 rounded text-sm font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider">
            Open Workspace
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div id="content">
        {/* Section 1: Hero */}
        <section id="hero">
          <div className="gradient-overlay"></div>
          <div className="content">
            <p className="subtitle">Our Purpose</p>
            <h1>
              Instantly craft viral
              <br/>
              <span className="underlined"><span className="line"></span><span>short-form videos</span></span>
              <br/>
              on autopilot.
            </h1>
            <div className="ctas">
              <div className="code-box">
                <span className="prompt">&gt;</span>
                <code>npm run start:pipeline</code>
              </div>
              <Link href="/workspace" className="cta-btn">Open Workspace <span>&rarr;</span></Link>
            </div>
          </div>
          <div className="bounce-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
          </div>
        </section>

        {/* Spacer */}
        <div style={{ height: '150vh' }}></div>

        {/* Cards Trigger Zone */}
        <div id="cards-trigger" style={{ height: '200vh' }}></div>

        {/* Spacer */}
        <div style={{ height: '100vh' }}></div>

        {/* Section 3 */}
        <section id="section-three">
          <div className="inner" id="section-three-inner">
            <p>Presenting</p>
            <h2>Brainrot AI</h2>
          </div>
        </section>
      </div>
    </div>
  );
}
