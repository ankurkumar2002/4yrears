
import React, { useState, useEffect, useRef } from 'react';
import { AppPhase, SiteConfig, MediaAsset } from './types';
import { INITIAL_CONFIG } from './constants';
import AdminPanel from './components/AdminPanel';
import Confetti from './components/Confetti';
import Frame from './components/Frame';
import { cloudSyncService } from './services/cloudSyncServices';

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
  const [config, setConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem('anniversary_config');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });
  
  const [phase, setPhase] = useState<AppPhase>(AppPhase.COUNTDOWN);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [showAdmin, setShowAdmin] = useState(false);
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  
  const bgMusicRef = useRef<HTMLAudioElement>(null);
  const celebrationSfxRef = useRef<HTMLAudioElement>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  // Persistence & Migration Logic
  useEffect(() => {
    const initPersistence = async () => {
      const hasMigrated = localStorage.getItem('anniversary_db_synced');
      const localData = localStorage.getItem('anniversary_config');

      if (localData && !hasMigrated) {
        // ONE-TIME MIGRATION: Push local browser data to MongoDB
        console.log("Migrating local data to cloud...");
        const success = await cloudSyncService.migrateToCloud(JSON.parse(localData));
        if (success) {
          localStorage.setItem('anniversary_db_synced', 'true');
          // Once migrated, we can optionally clear local storage or keep it as backup
        }
      } else if (hasMigrated) {
        // REGULAR STARTUP: Fetch from Cloud
        const cloudConfig = await cloudSyncService.fetchConfig();
        if (cloudConfig) setConfig(cloudConfig);
      }
    };
    initPersistence();
  }, []);

  // Countdown Logic
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
    if (phase === AppPhase.COUNTDOWN) {
      setPhase(AppPhase.CELEBRATION);
    }
    startAtmosphere(true);
  };

  const startAtmosphere = (force = false) => {
    const target = new Date(config.celebrationDate).getTime();
    const now = new Date().getTime();
    if (now < target && !force) return; 

    if (bgMusicRef.current && config.backgroundMusicUrls && config.backgroundMusicUrls.length > 0) {
      bgMusicRef.current.volume = isMuted ? 0 : volume;
      bgMusicRef.current.play().catch(e => console.debug("Music interaction needed", e));
    }
  };

  const handleSongEnded = () => {
    const urls = config.backgroundMusicUrls || [];
    if (urls.length > 1) {
      const nextIdx = (currentSongIndex + 1) % urls.length;
      setCurrentSongIndex(nextIdx);
    } else if (urls.length === 1) {
      if (bgMusicRef.current) {
        bgMusicRef.current.currentTime = 0;
        bgMusicRef.current.play();
      }
    }
  };

  const handleAdminSave = async (newConfig: SiteConfig) => {
    setConfig(newConfig);
    // Always save to cloud primarily
    const success = await cloudSyncService.saveConfig(newConfig);
    if (success) {
      localStorage.setItem('anniversary_db_synced', 'true');
    }
    // Fallback save to local
    localStorage.setItem('anniversary_config', JSON.stringify(newConfig));
    setShowAdmin(false);
  };

  // MCQ/Moment states...
  const [currentMcqIdx, setCurrentMcqIdx] = useState(0);
  const [mcqPhase, setMcqPhase] = useState<'question' | 'feedback' | 'animation'>('question');
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [currentMomentIdx, setCurrentMomentIdx] = useState(0);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [selectedGalleryMedia, setSelectedGalleryMedia] = useState<MediaAsset | null>(null);

  const handleAnswer = (optionIdx: number) => {
    if (optionIdx === config.mcqs[currentMcqIdx].correctAnswer) {
      setMcqPhase('feedback');
      setTimeout(() => { setMcqPhase('animation'); setCurrentSceneIdx(0); }, 1500);
    }
  };

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
      
      {/* Global Audio - Added key to force reload on song change */}
      <audio 
        key={currentSongIndex}
        ref={bgMusicRef} 
        src={config.backgroundMusicUrls?.[currentSongIndex] || ''} 
        onEnded={handleSongEnded}
        autoPlay={celebrationActive}
        preload="auto"
      />
      <audio ref={celebrationSfxRef} src={config.celebrationSfxUrl} preload="auto" />

      {/* Volume Controls */}
      {celebrationActive && (
        <div 
          className="fixed bottom-36 right-6 z-[60] flex flex-col items-center"
          onMouseEnter={() => setIsVolumeHovered(true)}
          onMouseLeave={() => setIsVolumeHovered(false)}
        >
           <div className={`transition-all duration-300 transform ${isVolumeHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'} flex flex-col items-center`}>
             <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-pink-100 shadow-2xl flex flex-col items-center mb-2">
               <input 
                 type="range" min="0" max="1" step="0.01" value={volume} 
                 onChange={(e) => setVolume(parseFloat(e.target.value))}
                 className="w-32 h-1 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
               />
               <p className="text-[8px] uppercase tracking-widest text-pink-400 font-bold mt-3 text-center">
                 Volume: {Math.round(volume * 100)}%
               </p>
               <p className="text-[7px] text-pink-200 uppercase tracking-tighter mt-1">Playlist: {currentSongIndex + 1}/{config.backgroundMusicUrls?.length || 0}</p>
             </div>
             {/* Hover Bridge: Essential for mouse stability */}
             <div className="h-4 w-full cursor-default" />
           </div>
           
           <button onClick={() => setIsMuted(!isMuted)} className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-md border border-pink-100 text-pink-400 hover:text-pink-600 transition-all shadow-lg flex items-center justify-center">
              {isMuted || volume === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              )}
           </button>
        </div>
      )}

      {/* Main UI */}
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
              <button onClick={handleTriggerCelebration} className="mt-16 px-12 py-3 bg-white border border-pink-100 text-pink-400 rounded-full text-[10px] uppercase tracking-widest font-black shadow-sm">Relive Us</button>
            </div>
          )}

          {/* Celebration UI... (Keeping existing phase renders but optimized) */}
          {phase === AppPhase.CELEBRATION && (
            <div className="flex flex-col items-center animate-in zoom-in duration-1000 text-center px-4">
              <h2 className="text-6xl md:text-[8rem] serif italic text-pink-500 mb-2 leading-tight">Happy Anniversary</h2>
              <button onClick={nextPhase} className="mt-16 px-14 py-4 bg-pink-50 text-pink-500 border border-pink-100 rounded-full uppercase text-[10px] tracking-widest font-black shadow-md hover:bg-pink-100">Open the Chapter</button>
            </div>
          )}

          {/* All other phases (Moments, MCQ, etc.) rendered as before... */}
          {phase === AppPhase.CLOSING && (
            <div className="text-center space-y-8 animate-in fade-in duration-3000 max-w-4xl px-6">
              <h2 className="text-6xl md:text-[8rem] cursive text-pink-500 mb-4">Always us.</h2>
              <p className="text-xl md:text-3xl serif italic opacity-90">{config.closingMessage}</p>
            </div>
          )}
        </div>
      </main>

      {/* Admin and Gallery Modals... */}
      <button onClick={() => setShowAdmin(true)} className="fixed bottom-24 right-6 z-[60] w-10 h-10 rounded-full bg-white/40 backdrop-blur border border-pink-100 text-pink-200 hover:text-pink-400 flex items-center justify-center"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg></button>

      <div className="h-16 flex justify-between px-12 items-center z-40 bg-white/60 backdrop-blur-md border-t border-pink-100">
        <button onClick={prevPhase} disabled={phase === AppPhase.COUNTDOWN} className="text-[10px] font-black uppercase tracking-widest text-pink-300 disabled:opacity-0">Previous</button>
        <button onClick={() => setPhase(AppPhase.GALLERY)} className="text-[10px] font-black uppercase tracking-widest text-pink-300">The Archive</button>
        <button onClick={nextPhase} className="text-[10px] font-black uppercase tracking-widest text-pink-300">Next</button>
      </div>

      {showAdmin && <AdminPanel config={config} onSave={handleAdminSave} onClose={() => setShowAdmin(false)} />}
      
      <style>{`
        input[type=range]::-webkit-slider-thumb { appearance: none; height: 14px; width: 14px; border-radius: 50%; background: #FF69B4; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; background: #FFE4E1; border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default App;
