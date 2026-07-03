'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function BrainrotLandingPage() {
  useEffect(() => {
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

    return () => {
      cancelAnimationFrame(cardsAnimId);
      window.removeEventListener('scroll', updateHeroOpacity);
    };
  }, []);

  return (
    <div className="veldara-theme">
      <style dangerouslySetInnerHTML={{ __html: `
        .veldara-theme {
          font-family: var(--font-inter), 'Inter', sans-serif; 
          background: transparent; 
          color: #fff;
          min-height: 100vh;
        }
        .veldara-theme .fixed { position: fixed; }
        .veldara-theme .absolute { position: absolute; }
        .veldara-theme .relative { position: relative; }
        .veldara-theme .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
        
        .veldara-theme section { scroll-margin-top: 80px; }

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
          background: linear-gradient(to top, rgba(6, 4, 10, 0.8) 0%, transparent 50%);
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

        /* Features */
        #features {
          position: relative; z-index: 10; padding: 6rem 2.5rem; background: transparent; display: flex; flex-direction: column; align-items: center;
        }
        .section-title {
          font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin-bottom: 4rem; text-align: center;
          background: linear-gradient(135deg, #fff 40%, #A855F7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .feature-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; max-width: 72rem; width: 100%;
        }
        .feature-card {
          background: rgba(15, 10, 25, 0.6); border: 1px solid rgba(168, 85, 247, 0.2); padding: 2rem; border-radius: 0.75rem;
          display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; transition: transform 0.2s, border-color 0.2s;
        }
        .feature-card:hover { transform: translateY(-4px); border-color: rgba(168, 85, 247, 0.6); }
        .feature-icon {
          display: flex; align-items: center; justify-content: center; width: 3rem; height: 3rem; border-radius: 0.5rem;
          background: rgba(168, 85, 247, 0.2); color: #A855F7;
        }
        .feature-card h3 { font-size: 1.25rem; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
        .feature-card p { color: #9ca3af; font-size: 0.9rem; line-height: 1.6; }

        /* Cards (Pipeline) */
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
        #fixed-cards .step { font-size: 0.75rem; font-weight: 700; color: #06B6D4; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; display: block; }

        /* Pricing */
        #pricing {
          position: relative; z-index: 10; padding: 6rem 2.5rem; background: transparent; display: flex; flex-direction: column; align-items: center;
        }
        .pricing-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 60rem; width: 100%;
        }
        .pricing-card {
          background: rgba(15, 10, 25, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); padding: 3rem 2rem; border-radius: 1rem;
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.5rem; position: relative;
        }
        .pricing-card.popular {
          border-color: rgba(168, 85, 247, 0.5); box-shadow: 0 8px 32px rgba(168, 85, 247, 0.15);
        }
        .pricing-card.popular::before {
          content: 'Most Popular'; position: absolute; top: -0.75rem; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, #A855F7, #7C3AED); color: #fff; font-size: 0.75rem; font-weight: 700;
          padding: 0.25rem 1rem; border-radius: 1rem; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .pricing-card h3 { font-size: 1.5rem; font-weight: 700; color: #fff; }
        .pricing-card .price { font-size: 3rem; font-weight: 800; color: #fff; display: flex; align-items: flex-start; justify-content: center; }
        .pricing-card .price span { font-size: 1rem; font-weight: 500; color: #9ca3af; margin-top: 0.5rem; }
        .pricing-card ul { list-style: none; display: flex; flex-direction: column; gap: 1rem; text-align: left; width: 100%; margin-top: 1rem; }
        .pricing-card ul li { display: flex; align-items: center; gap: 0.75rem; color: #d1d5db; font-size: 0.95rem; }
        .pricing-card ul li svg { width: 1.25rem; height: 1.25rem; color: #06B6D4; flex-shrink: 0; }
        .pricing-btn {
          width: 100%; padding: 1rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; text-align: center; transition: all 0.2s;
        }
        .pricing-btn.primary { background: linear-gradient(135deg, #A855F7, #7C3AED); color: #fff; }
        .pricing-btn.primary:hover { box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4); }
        .pricing-btn.secondary { background: rgba(255, 255, 255, 0.1); color: #fff; }
        .pricing-btn.secondary:hover { background: rgba(255, 255, 255, 0.2); }

        /* Footer */
        footer {
          position: relative; z-index: 10; background: transparent; border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 3rem 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center;
        }
        footer p { color: #6b7280; font-size: 0.875rem; }
        footer .links { display: flex; gap: 1.5rem; }
        footer .links a { color: #9ca3af; text-decoration: none; font-size: 0.875rem; transition: color 0.2s; }
        footer .links a:hover { color: #fff; }

        /* Responsive */
        @media (max-width: 768px) {
          .veldara-theme nav { padding: 1rem 1.5rem; }
          .veldara-theme nav .nav-links { display: none; }
          #hero .content { padding-bottom: 5rem; }
          #hero h1 { font-size: 1.75rem; }
          #hero .ctas { flex-direction: column; width: 100%; }
          #hero .cta-btn { width: 100%; justify-content: center; }
          #fixed-cards .grid { grid-template-columns: 1fr; gap: 1rem; }
          #fixed-cards { padding: 1.5rem 1rem; }
          #features { padding: 4rem 1.5rem; }
          #pricing { padding: 4rem 1.5rem; }
        }
      `}} />

      {/* Background provided by AnimatedBackground in layout.tsx */}

      {/* Fixed Cards for Pipeline */}
      <div id="fixed-cards">
        <div className="grid">
          <div className="card">
            <span className="step">Step 01</span>
            <h3>Script & Voice</h3>
            <p>Gemini 2.5 Flash drafts a highly engaging viral script. Edge TTS brings it to life with clear, natural human-sounding voiceovers entirely for free.</p>
          </div>
          <div className="card">
            <span className="step">Step 02</span>
            <h3>Subtitles & Render</h3>
            <p>Local Whisper.cpp extracts word-level timestamps. FFmpeg intelligently crops your background footage and burns in eye-catching ASS subtitles.</p>
          </div>
          <div className="card">
            <span className="step">Step 03</span>
            <h3>Schedule & Post</h3>
            <p>Link your YouTube and Instagram accounts securely. Our local matrix scheduler automatically pushes your completed videos at optimal times (e.g., 12:30 PM & 7:30 PM).</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav>
        <div className="nav-container">
          <Link href="/" className="logo cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 shadow-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">brainrot.ai</span>
          </Link>
          <div className="nav-links">
            <Link href="#features">Features</Link>
            <Link href="#pipeline">Pipeline</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="/how-to-use">Docs</Link>
          </div>
        </div>
        <div className="social">
          <Link href="/login" className="bg-white text-black px-4 py-1.5 rounded text-sm font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider">
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
              <Link href="/workspace" className="cta-btn">Open Workspace <span>&rarr;</span></Link>
            </div>
          </div>
          <div className="bounce-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
          </div>
        </section>

        {/* Section 2: Features */}
        <section id="features">
          <h2 className="section-title">Zero-Cost Tech Stack</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>
              </div>
              <h3>AI Script Generation</h3>
              <p>Powered by Google Gemini 2.5 Flash. Generate highly engaging, niche-specific viral scripts instantly using your 15 RPM free tier.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg>
              </div>
              <h3>Free Edge TTS</h3>
              <p>Ditch expensive voiceover APIs. We utilize Microsoft Edge TTS via Python to generate unlimited, natural-sounding voiceovers at absolutely zero cost.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>
              </div>
              <h3>Whisper Subtitles</h3>
              <p>We run Whisper.cpp locally to extract highly accurate word-level timestamps, transforming plain voiceovers into dynamic, TikTok-style captioned shorts.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
              </div>
              <h3>Automated Matrix</h3>
              <p>Set it and forget it. Our cron-based scheduler renders videos and publishes them directly to your linked YouTube and Instagram accounts daily.</p>
            </div>
          </div>
        </section>

        {/* Pipeline Trigger Zone - The anchor is placed right here */}
        <div id="pipeline" style={{ position: 'relative', top: '-100px' }}></div>
        <div id="cards-trigger" style={{ height: '200vh' }}></div>

        {/* Spacer */}
        <div style={{ height: '50vh' }}></div>

        {/* Section 4: Pricing */}
        <section id="pricing">
          <h2 className="section-title">Pricing Plans</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Hobby</h3>
              <div className="price">$0<span>/mo</span></div>
              <ul>
                <li><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> 1 Connected Account</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> 3 Videos Per Day</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Standard Render Priority</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Gemini 2.5 Flash Support</li>
              </ul>
              <Link href="/workspace" className="pricing-btn secondary">Get Started Free</Link>
            </div>
            
            <div className="pricing-card popular">
              <h3>Creator Pro</h3>
              <div className="price">$15<span>/mo</span></div>
              <ul>
                <li><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Unlimited Accounts</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Unlimited Videos</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> High Priority Rendering</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> GPT-4o Script Generation</li>
                <li><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Premium TTS Voices</li>
              </ul>
              <Link href="/workspace" className="pricing-btn primary">Upgrade to Pro</Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer>
          <span className="logo" style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.025em' }}>brainrot.ai</span>
          <p>© {new Date().getFullYear()} Brainrot Video Automator. All rights reserved.</p>
          <div className="links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/how-to-use">Documentation</Link>
            <a href="https://github.com/Dark-VenomX/brainrot-automator" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
