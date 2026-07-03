'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, TrendingUp, Menu, X } from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-sans">
      {/* Animated CSS Background replacing the broken video */}
      <div className="absolute inset-0 z-0 bg-black">
        <div className="absolute inset-0 opacity-30 mix-blend-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-blob animation-delay-4000" />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-oswald text-2xl tracking-wider font-bold">BRAINROT.AI</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">Features</Link>
          <Link href="#pipeline" className="text-sm text-gray-300 hover:text-white transition-colors">Pipeline</Link>
          <Link href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">Pricing</Link>
          <Link href="#docs" className="text-sm text-gray-300 hover:text-white transition-colors">Docs</Link>
        </div>

        <div className="hidden md:block">
          <Link 
            href="/login" 
            className="px-6 py-2 border border-white/20 hover:border-white/60 rounded-full text-sm font-medium transition-all hover:bg-white/10"
          >
            OPEN WORKSPACE
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-white z-50 relative"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center gap-8 text-2xl font-oswald tracking-widest">
            <Link href="#features" className="animate-fade-up opacity-0" style={{ animationDelay: '0.1s' }} onClick={() => setMobileMenuOpen(false)}>FEATURES</Link>
            <Link href="#pipeline" className="animate-fade-up opacity-0" style={{ animationDelay: '0.2s' }} onClick={() => setMobileMenuOpen(false)}>PIPELINE</Link>
            <Link href="#pricing" className="animate-fade-up opacity-0" style={{ animationDelay: '0.3s' }} onClick={() => setMobileMenuOpen(false)}>PRICING</Link>
            <Link href="#docs" className="animate-fade-up opacity-0" style={{ animationDelay: '0.4s' }} onClick={() => setMobileMenuOpen(false)}>DOCS</Link>
            <Link href="/login" className="mt-8 px-8 py-3 border border-white rounded-full animate-fade-up opacity-0 hover:bg-white hover:text-black transition-colors" style={{ animationDelay: '0.5s' }} onClick={() => setMobileMenuOpen(false)}>
              OPEN WORKSPACE
            </Link>
          </div>
        </div>
      )}

      {/* Hero Content */}
      <main className="relative z-10 flex flex-col justify-center min-h-[calc(100vh-100px)] max-w-7xl mx-auto px-6">
        <div className="max-w-4xl space-y-8">
          
          {/* Heading */}
          <div className="font-oswald font-bold uppercase leading-[1.1] drop-shadow-2xl">
            <h1 className={`text-[clamp(2.8rem,8vw,7rem)] ${mounted ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>GENERATE.</h1>
            <h1 className={`text-[clamp(2.8rem,8vw,7rem)] text-gray-300 ${mounted ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>SCHEDULE.</h1>
            <h1 className={`text-[clamp(2.8rem,8vw,7rem)] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 ${mounted ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>DOMINATE.</h1>
          </div>

          {/* Subtext */}
          <p className={`text-lg md:text-xl text-gray-400 max-w-2xl ${mounted ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
            The ultimate open-source engine that writes, edits, and schedules viral short-form content — while you sleep.
          </p>

          {/* CTA Row */}
          <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4 ${mounted ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '1.0s' }}>
            <Link 
              href="/login" 
              className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform"
            >
              OPEN WORKSPACE
              <ArrowUpRight className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="p-3 bg-white/5 rounded-full border border-white/10">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-sm font-medium">Self-Sufficient<br/>Matrix Scheduler</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className={`grid grid-cols-2 md:grid-cols-3 gap-8 pt-16 border-t border-white/10 ${mounted ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: '1.2s' }}>
            <div>
              <div className="text-3xl font-oswald font-bold text-white mb-1">100M+</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Views Generated</div>
            </div>
            <div>
              <div className="text-3xl font-oswald font-bold text-white mb-1">$0</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">API Costs</div>
            </div>
            <div className="hidden md:block">
              <div className="text-3xl font-oswald font-bold text-white mb-1">2x</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Daily Auto-Posts</div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
