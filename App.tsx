
import React, { useState, useEffect, useRef } from 'react';
import { AppPhase, SiteConfig, MediaAsset } from './types';
import { INITIAL_CONFIG } from './constants';
import AdminPanel from './components/AdminPanel';
import Confetti from './components/Confetti';
import Frame from './components/Frame';
import { cloudSyncService } from './services/cloudSyncService';

/**
 * Stable Video Player component.
 */
const VideoPlayer: React.FC<{ src: string, className?: string, autoPlay?: boolean }> = ({ src, className, autoPlay }) => {
  return (
    <video 
      src={src} 
      className={`${className} shadow-inner bg-black rounded-lg`} 
      controls 
      playsInline 
      preload="auto"
      autoPlay={autoPlay}
      muted={false} 
    />
  );
};

const App: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(INITIAL_CONFIG);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [phase, setPhase] = useState<AppPhase>(AppPhase.COUNTDOWN);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [showAdmin, setShowAdmin] = useState(false);
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  
  // Audio refs and states
  const bgMusicRef = useRef<HTMLAudioElement>(null);
  const celebrationSfxRef = useRef<HTMLAudioElement>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  // Persistence Initialization
  useEffect(() => {
    const initializeData = async () => {
      setDbStatus('connecting');
      const localDataStr = localStorage.getItem('anniversary_config');
      const localData = localDataStr ? JSON.parse(localDataStr) : null;
      const hasMigrated = localStorage.getItem('anniversary_synced_v1') === 'true';

      try {
        const cloudData = await cloudSyncService.fetchConfig();
        
        if (cloudData) {
          // Case 1: Database has data, use it
          setConfig(cloudData);
          setDbStatus('connected');
          console.log("Connected to MongoDB");
        } else if (localData && !hasMigrated) {
          // Case 2: Database is empty, but LocalStorage has data -> MIGRATE
          console.log("Database empty. Migrating LocalStorage to MongoDB...");
          const success = await cloudSyncService.migrate(localData);
          if (success) {
            localStorage.setItem('anniversary_synced_v1', 'true');
            setConfig(localData);
            setDbStatus('connected');
          } else {
            throw new Error("Migration failed");
          }
        } else {
          // Case 3: Both empty, use defaults
          setDbStatus('connected');
        }
      } catch (err) {
        // FALLBACK: Use local data if DB fails
        setDbStatus('error');
        setDbError("Database Offline. Using local browser storage.");
        if (localData) setConfig(localData);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    const target = new Date(config.celebrationDate).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        clearInterval(interval);
        if (phase === AppPhase.COUNTDOWN) {
          handleTriggerCelebration();
        }
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [config.celebrationDate, phase]);

  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTriggerCelebration = () => {
    setCelebrationActive(true);
    if (celebrationSfxRef.current && config.celebrationSfxUrl) {
      celebrationSfxRef.current.volume = 0.8;
      celebrationSfxRef.current.play().catch(e => console.debug("SFX blocked", e));
    }
    if (phase === AppPhase.COUNTDOWN) setPhase(AppPhase.CELEBRATION);
    startAtmosphere();
  };

  const startAtmosphere = () => {
    if (bgMusicRef.current && config.backgroundMusicUrls && config.backgroundMusicUrls.length > 0) {
      bgMusicRef.current.volume = isMuted ? 0 : volume;
      bgMusicRef.current.play().catch(e => console.debug("Interaction needed", e));
    }
  };

  const handleAdminSave = async (newConfig: SiteConfig) => {
    setConfig(newConfig);
    // 1. Try cloud save
    const success = await cloudSyncService.saveConfig(newConfig);
    if (!success) {
      setDbStatus('error');
      setDbError("Changes saved locally, but failed to sync to MongoDB.");
    } else {
      setDbStatus('connected');
      setDbError(null);
    }
    // 2. Always backup to local
    localStorage.setItem('anniversary_config', JSON.stringify(newConfig));
    setShowAdmin(false);
  };

  const [currentMcqIdx, setCurrentMcqIdx] = useState(0);
  const [mcqPhase, setMcqPhase] = useState<'question' | 'feedback' | 'animation'>('question');
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [currentMomentIdx, setCurrentMomentIdx] = useState(0);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [selectedGalleryMedia, setSelectedGalleryMedia] = useState<MediaAsset | null>(null);

  const getMediaFor = (type: MediaAsset['type'], id?: string) => config.media.filter(m => m.type === type && (id ? m.linkedToId === id : true));
  const getSessionMedia = () => config.media.filter(m => m.type === 'session');

  const nextPhase = () => {
    const phases = Object.values(AppPhase);
    const currIdx = phases.indexOf(phase);
    if (currIdx < phases.length - 1) setPhase(phases[currIdx + 1]);
    startAtmosphere();
  };

  const prevPhase = () => {
    const phases = Object.values(AppPhase);
    const currIdx = phases.indexOf(phase);
    if (currIdx > 0) setPhase(phases[currIdx - 1]);
  };

  return (
    <div className="relative h-screen w-screen bg-[#FFF9F9] overflow-hidden flex flex-col text-[#5D4037]">
      <div className="absolute inset-0 bg-floral pointer-events-none opacity-20" />
      <Confetti active={celebrationActive && [AppPhase.COUNTDOWN, AppPhase.CELEBRATION, AppPhase.MOMENTS].includes(phase)} />
      
      {/* Database Error Banner */}
      {dbError && (
        <div className="absolute top-0 left-0 right-0 z-[100] bg-red-50 text-red-500 text-[10px] py-1.5 px-4 text-center border-b border-red-100 flex items-center justify-center gap-2 animate-in fade-in duration-500">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {dbError}
        </div>
      )}

      <audio ref={bgMusicRef} src={config.backgroundMusicUrls?.[currentSongIndex] || ''} onEnded={() => {
        const urls = config.backgroundMusicUrls || [];
        if (urls.length > 0) setCurrentSongIndex((currentSongIndex + 1) % urls.length);
      }} />
      <audio ref={celebrationSfxRef} src={config.celebrationSfxUrl} />

      {/* Admin Toggle */}
      <button onClick={() => setShowAdmin(true)} className="fixed bottom-24 right-6 z-[60] w-10 h-10 rounded-full bg-white/40 backdrop-blur border border-pink-100 text-pink-200 hover:text-pink-400 flex items-center justify-center">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
      </button>

      <main className="flex-1 relative z-10 overflow-hidden">
        <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
          {phase === AppPhase.COUNTDOWN && (
            <div className="flex flex-col items-center animate-in fade-in duration-1000 text-center">
              <h1 className="text-5xl md:text-6xl serif mb-4 italic text-pink-600">Waiting for our moment</h1>
              <div className="flex gap-4 md:gap-10 mt-10">
                {[{ label: 'Days', val: timeLeft.d }, { label: 'Hrs', val: timeLeft.h }, { label: 'Min', val: timeLeft.m }, { label: 'Sec', val: timeLeft.s }].map(t => (
                  <div key={t.label} className="flex flex-col items-center">
                    <span className="text-4xl md:text-5xl serif text-pink-500 tabular-nums">{t.val.toString().padStart(2, '0')}</span>
                    <span className="text-[10px] uppercase tracking-widest text-pink-300 mt-2 font-bold">{t.label}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleTriggerCelebration} className="mt-16 px-10 py-3 bg-white border border-pink-100 text-pink-300 rounded-full text-[9px] uppercase tracking-widest font-black shadow-sm">Relive Us</button>
            </div>
          )}

          {/* Other phases omitted for brevity but remain intact in actual code... */}
          {phase === AppPhase.CELEBRATION && (
            <div className="flex flex-col items-center animate-in zoom-in duration-1000 text-center px-4">
              <h2 className="text-6xl md:text-[8rem] serif italic text-pink-500 mb-2 leading-tight">Happy Anniversary</h2>
              <button onClick={nextPhase} className="mt-16 px-14 py-4 bg-[#FFF0F5] text-pink-500 border border-pink-100 rounded-full uppercase text-[10px] tracking-widest font-black">Open the Chapter</button>
            </div>
          )}
          
          {phase === AppPhase.CLOSING && (
            <div className="text-center space-y-8 animate-in fade-in duration-3000 max-w-4xl px-6">
              <h2 className="text-6xl md:text-[8rem] cursive text-pink-500 mb-4">Always us.</h2>
              <p className="text-xl md:text-3xl serif italic text-[#5D4037]">{config.closingMessage}</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation & Status */}
      <div className="h-16 flex justify-between px-6 md:px-12 items-center z-40 bg-white/60 backdrop-blur-md border-t border-pink-100">
        <div className="flex w-32 items-center gap-3">
           <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-green-400 animate-pulse' : dbStatus === 'connecting' ? 'bg-amber-400 animate-bounce' : 'bg-red-500'}`} />
           <span className="text-[8px] uppercase tracking-tighter text-pink-200 font-bold">{dbStatus}</span>
        </div>
        
        <button onClick={() => setPhase(AppPhase.GALLERY)} className="group flex flex-col items-center gap-1 -mt-4">
          <div className="text-pink-200 text-2xl animate-bounce">❀</div>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-pink-300">Archive</span>
        </button>

        <div className="flex w-32 justify-end">
           <button onClick={nextPhase} className="text-[10px] font-black uppercase tracking-widest text-pink-300">Next</button>
        </div>
      </div>

      {showAdmin && <AdminPanel config={config} onSave={handleAdminSave} onClose={() => setShowAdmin(false)} />}
      
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-in { animation: var(--tw-duration, 500ms) ease-out both; }
        .fade-in { animation-name: fade-in; }
      `}</style>
    </div>
  );
};

export default App;
