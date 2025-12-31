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
  const [dbStatus, setDbStatus] = useState<'cloud' | 'local' | 'error'>('local');
  
  const [phase, setPhase] = useState<AppPhase>(AppPhase.COUNTDOWN);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [showAdmin, setShowAdmin] = useState(false);
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  
  const bgMusicRef = useRef<HTMLAudioElement>(null);
  const celebrationSfxRef = useRef<HTMLAudioElement>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  const [currentMcqIdx, setCurrentMcqIdx] = useState(0);
  const [mcqPhase, setMcqPhase] = useState<'question' | 'feedback' | 'animation'>('question');
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [currentMomentIdx, setCurrentMomentIdx] = useState(0);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [selectedGalleryMedia, setSelectedGalleryMedia] = useState<MediaAsset | null>(null);

  // Initialize Data: Cloud (Priority) -> LocalStorage (Fallback)
  useEffect(() => {
    const initData = async () => {
      const savedLocal = localStorage.getItem('anniversary_config');
      const localConfig = savedLocal ? JSON.parse(savedLocal) : INITIAL_CONFIG;
      
      try {
        const cloudConfig = await cloudSyncService.fetchConfig();
        if (cloudConfig) {
          console.log("Cloud data loaded successfully.");
          setConfig(cloudConfig);
          setDbStatus('cloud');
          // Keep local storage in sync
          localStorage.setItem('anniversary_config', JSON.stringify(cloudConfig));
        } else {
          console.log("Cloud data missing or unreachable, using local fallback.");
          setConfig(localConfig);
          setDbStatus('local');
          // Try to migrate local data to cloud if it was just a "missing doc" issue
          if (savedLocal) {
            cloudSyncService.migrateToCloud(localConfig).then(success => {
              if (success) setDbStatus('cloud');
            });
          }
        }
      } catch (e) {
        console.warn("Connection error during init, staying on local storage.");
        setConfig(localConfig);
        setDbStatus('error');
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const target = new Date(config.celebrationDate).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        clearInterval(interval);
        if (phase === AppPhase.COUNTDOWN) handleTriggerCelebration();
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
      celebrationSfxRef.current.play().catch(() => {});
    }
    if (phase === AppPhase.COUNTDOWN) setPhase(AppPhase.CELEBRATION);
  };

  const handleSongEnded = () => {
    const urls = config.backgroundMusicUrls || [];
    if (urls.length > 0) {
      setCurrentSongIndex((currentSongIndex + 1) % urls.length);
    }
  };

  const handleAdminSave = async (newConfig: SiteConfig) => {
    // 1. Update State
    setConfig(newConfig);
    // 2. Persist Local
    localStorage.setItem('anniversary_config', JSON.stringify(newConfig));
    
    // 3. Persist Cloud
    const success = await cloudSyncService.saveConfig(newConfig);
    setDbStatus(success ? 'cloud' : 'error');
    
    setShowAdmin(false);
  };

  const handleAnswer = (optionIdx: number) => {
    const mcq = config.mcqs[currentMcqIdx];
    if (optionIdx === mcq.correctAnswer) {
      setMcqPhase('feedback');
      setTimeout(() => {
        setMcqPhase('animation');
        setCurrentSceneIdx(0);
      }, 1500);
    }
  };

  const getMediaFor = (type: MediaAsset['type'], id?: string) => {
    return config.media.filter(m => m.type === type && (id ? m.linkedToId === id : true));
  };

  const nextPhase = () => {
    const phases = Object.values(AppPhase);
    const currIdx = phases.indexOf(phase);
    if (currIdx < phases.length - 1) setPhase(phases[currIdx + 1]);
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
      
      <audio ref={bgMusicRef} src={config.backgroundMusicUrls?.[currentSongIndex] || ''} onEnded={handleSongEnded} />
      <audio ref={celebrationSfxRef} src={config.celebrationSfxUrl} />

      {/* Cloud Status Indicator */}
      <div className="fixed top-4 left-6 z-[60] flex items-center gap-2 px-3 py-1 bg-white/40 backdrop-blur rounded-full border border-pink-50 shadow-sm">
        <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'cloud' ? 'bg-green-400 animate-pulse' : dbStatus === 'local' ? 'bg-amber-400' : 'bg-red-400'}`} />
        <span className="text-[8px] uppercase tracking-widest text-pink-300 font-bold">{dbStatus === 'cloud' ? 'Cloud Connected' : dbStatus === 'local' ? 'Local Only' : 'Sync Error'}</span>
      </div>

      <button onClick={() => setShowAdmin(true)} className="fixed bottom-24 right-6 z-[60] w-10 h-10 rounded-full bg-white/40 backdrop-blur border border-pink-100 text-pink-200 hover:text-pink-400 shadow-sm flex items-center justify-center transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
      </button>

      <main className="flex-1 relative z-10 overflow-hidden">
        <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto">
          {phase === AppPhase.COUNTDOWN && (
            <div className="flex flex-col items-center animate-in fade-in duration-1000 text-center">
              <h1 className="text-5xl md:text-6xl serif mb-4 italic text-pink-600">Waiting for our moment</h1>
              <div className="flex gap-4 md:gap-10 mt-10">
                {[{ label: 'Days', val: timeLeft.d }, { label: 'Hrs', val: timeLeft.h }, { label: 'Min', val: timeLeft.m }, { label: 'Sec', val: timeLeft.s }].map(t => (
                  <div key={t.label} className="flex flex-col items-center">
                    <span className="text-4xl md:text-5xl serif text-[#FF69B4] tabular-nums">{t.val.toString().padStart(2, '0')}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-pink-300 mt-2 font-bold">{t.label}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleTriggerCelebration} className="mt-16 px-10 py-3 bg-white border border-pink-100 text-pink-300 rounded-full text-[9px] uppercase tracking-widest font-black shadow-sm">Relive Us</button>
            </div>
          )}

          {phase === AppPhase.CELEBRATION && (
            <div className="flex flex-col items-center animate-in zoom-in duration-1000 text-center px-4">
              <h2 className="text-6xl md:text-[8rem] serif italic text-pink-500 mb-2 leading-tight">Happy Anniversary</h2>
              <button onClick={nextPhase} className="mt-16 px-14 py-4 bg-[#FFF0F5] text-pink-500 border border-pink-100 rounded-full uppercase text-[10px] tracking-widest font-black shadow-sm">Open the Chapter</button>
            </div>
          )}

          {phase === AppPhase.MOMENTS && (
            <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-700">
               {config.moments[currentMomentIdx] && (
                 <div className="w-full flex flex-col items-center gap-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full items-center min-h-[400px]">
                     <div className="flex flex-col justify-center space-y-6 text-center md:text-left order-2 md:order-1">
                       <p className="text-3xl md:text-5xl serif italic text-[#5D4037] leading-relaxed">"{config.moments[currentMomentIdx].description}"</p>
                     </div>
                     <div className="flex justify-center order-1 md:order-2">
                       <Frame className="w-full max-w-md">
                         {getMediaFor('animation', config.moments[currentMomentIdx].id)[0]?.resourceType === 'image' ? (
                           <img src={getMediaFor('animation', config.moments[currentMomentIdx].id)[0].url} className="w-full aspect-[4/5] object-cover" />
                         ) : (
                           <VideoPlayer src={getMediaFor('animation', config.moments[currentMomentIdx].id)[0]?.url} className="w-full aspect-[4/5] object-cover" />
                         )}
                       </Frame>
                     </div>
                   </div>
                   <div className="flex items-center gap-4 mt-8">
                     <button onClick={() => setCurrentMomentIdx(p => Math.max(0, p-1))} disabled={currentMomentIdx === 0} className="w-10 h-10 border border-pink-100 rounded-full bg-white text-pink-200 disabled:opacity-20 hover:text-pink-400 transition-all">←</button>
                     <button onClick={() => currentMomentIdx < config.moments.length - 1 ? setCurrentMomentIdx(p => p + 1) : nextPhase()} className="px-16 md:px-24 py-4 bg-pink-50 text-pink-500 rounded-full serif italic text-xl border border-pink-100">
                       {currentMomentIdx < config.moments.length - 1 ? 'CONTINUE' : 'OUR MEMORIES'}
                     </button>
                   </div>
                 </div>
               )}
            </div>
          )}

          {phase === AppPhase.MCQ && (
            <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in duration-700">
               {mcqPhase === 'question' && config.mcqs[currentMcqIdx] && (
                 <div className="w-full text-center space-y-12">
                   <h3 className="text-3xl md:text-4xl serif italic text-pink-700 px-4">"{config.mcqs[currentMcqIdx].question}"</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mx-auto px-4">
                     {config.mcqs[currentMcqIdx].options.map((opt, idx) => (
                       <button key={idx} onClick={() => handleAnswer(idx)} className="p-5 bg-white border border-pink-100 rounded-xl text-md serif italic hover:border-pink-300 transition-all shadow-sm">{opt}</button>
                     ))}
                   </div>
                 </div>
               )}
               {mcqPhase === 'feedback' && <div className="text-center text-4xl cursive text-pink-400">Yes, precisely...</div>}
               {mcqPhase === 'animation' && (
                 <div className="flex flex-col items-center space-y-8 w-full px-4">
                    <Frame className="max-w-2xl w-full">
                       {getMediaFor('mcq', config.mcqs[currentMcqIdx].id)[currentSceneIdx]?.resourceType === 'image' ? (
                         <img src={getMediaFor('mcq', config.mcqs[currentMcqIdx].id)[currentSceneIdx].url} className="w-full max-h-[55vh] object-contain" />
                       ) : (
                         <VideoPlayer src={getMediaFor('mcq', config.mcqs[currentMcqIdx].id)[currentSceneIdx]?.url} className="w-full max-h-[55vh]" />
                       )}
                    </Frame>
                    <div className="flex gap-6">
                       <button onClick={() => currentSceneIdx > 0 ? setCurrentSceneIdx(p => p - 1) : setMcqPhase('question')} className="px-10 py-2 border border-pink-100 rounded-full text-pink-400 bg-white/50">Back</button>
                       <button onClick={() => {
                           const media = getMediaFor('mcq', config.mcqs[currentMcqIdx].id);
                           if (currentSceneIdx < media.length - 1) setCurrentSceneIdx(p => p + 1);
                           else currentMcqIdx < config.mcqs.length - 1 ? (setCurrentMcqIdx(p => p + 1), setMcqPhase('question')) : nextPhase();
                         }} className="px-14 py-2 bg-pink-500 text-white rounded-full shadow-lg font-bold">Next</button>
                    </div>
                 </div>
               )}
            </div>
          )}

          {phase === AppPhase.PAUSE && (
            <div className="text-center space-y-12 animate-in fade-in duration-1000 max-w-3xl px-6">
              <p className="text-3xl md:text-4xl serif italic text-[#5D4037] leading-relaxed">{config.pauseMessage}</p>
              <button onClick={nextPhase} className="px-12 py-3 bg-[#FFF0F5] text-pink-500 rounded-full uppercase text-[9px] tracking-widest font-black shadow-sm">Our Shared Moments</button>
            </div>
          )}

          {phase === AppPhase.PHOTOSESSION && (
            <div className="w-full h-full flex flex-col items-center animate-in fade-in duration-700">
               <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center gap-6 px-4">
                 {config.media.filter(m => m.type === 'session')[currentSlideIdx] && (
                   <>
                     <Frame className="w-full max-w-3xl">
                       {config.media.filter(m => m.type === 'session')[currentSlideIdx].resourceType === 'image' ? (
                         <img src={config.media.filter(m => m.type === 'session')[currentSlideIdx].url} className="w-full max-h-[60vh] object-contain" />
                       ) : (
                         <VideoPlayer src={config.media.filter(m => m.type === 'session')[currentSlideIdx].url} className="w-full max-h-[60vh]" />
                       )}
                     </Frame>
                     {config.media.filter(m => m.type === 'session')[currentSlideIdx].quote && (
                       <p className="text-lg serif italic text-[#5D4037] text-center max-w-xl">"{config.media.filter(m => m.type === 'session')[currentSlideIdx].quote}"</p>
                     )}
                   </>
                 )}
                 <div className="flex gap-6 mt-4">
                   <button disabled={currentSlideIdx === 0} onClick={() => setCurrentSlideIdx(p => p - 1)} className="px-8 py-2 border border-pink-100 rounded-full text-pink-400 bg-white/50 disabled:opacity-20">Back</button>
                   <button onClick={() => currentSlideIdx < config.media.filter(m => m.type === 'session').length - 1 ? setCurrentSlideIdx(p => p + 1) : nextPhase()} className="px-12 py-2 bg-pink-500 text-white rounded-full shadow-lg font-bold uppercase tracking-widest text-[10px]">
                     {currentSlideIdx < config.media.filter(m => m.type === 'session').length - 1 ? 'Next Memory' : 'Our Shared Promise'}
                   </button>
                 </div>
               </div>
            </div>
          )}

          {phase === AppPhase.PARTNER_SHARE && (
            <div className="max-w-4xl w-full text-center space-y-12 px-6 animate-in fade-in duration-1000">
              <h2 className="text-5xl md:text-7xl serif italic text-pink-600 leading-tight">{config.partnerPrompt}</h2>
              <p className="text-2xl md:text-4xl serif italic text-[#5D4037] leading-[1.6] max-w-3xl mx-auto">{config.partnerStaticMessage}</p>
              <button onClick={nextPhase} className="px-16 py-4 bg-pink-500 text-white rounded-full shadow-lg font-bold text-[10px] uppercase tracking-widest">Final Reflections</button>
            </div>
          )}

          {phase === AppPhase.CLOSING && (
            <div className="text-center space-y-8 animate-in fade-in duration-3000 max-w-4xl px-6">
              <h2 className="text-6xl md:text-[8rem] cursive text-pink-500 mb-4">Always us.</h2>
              <p className="text-xl md:text-3xl serif italic text-[#5D4037] leading-relaxed max-w-2xl mx-auto">{config.closingMessage}</p>
            </div>
          )}

          {phase === AppPhase.GALLERY && (
            <div className="w-full h-full max-w-7xl mx-auto flex flex-col p-4 md:p-8 animate-in slide-in-from-bottom duration-700">
               <div className="flex justify-between items-end mb-10 border-b border-pink-100 pb-6">
                 <h2 className="text-4xl md:text-6xl serif italic text-pink-600">The Archive</h2>
                 <button onClick={() => setPhase(AppPhase.CELEBRATION)} className="text-[10px] uppercase tracking-widest font-black text-pink-500 border border-pink-200 px-8 py-3 rounded-full bg-white">Close Archive</button>
               </div>
               <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pb-20">
                   {config.media.map((m) => (
                     <div key={m.id} onClick={() => setSelectedGalleryMedia(m)} className="relative aspect-square bg-white border border-pink-100 rounded-lg overflow-hidden cursor-zoom-in group shadow-sm hover:shadow-md transition-all">
                       {m.resourceType === 'image' ? (
                         <img src={m.url} className="w-full h-full object-cover" alt="Memory" />
                       ) : (
                         <div className="w-full h-full bg-black flex items-center justify-center">
                           <video src={`${m.url}#t=0.1`} className="w-full h-full object-cover opacity-60" muted />
                           <div className="absolute inset-0 flex items-center justify-center">
                             <div className="bg-white/20 p-2 rounded-full"><svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg></div>
                           </div>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Lightbox */}
      {selectedGalleryMedia && (
        <div className="fixed inset-0 z-[100] bg-[#FFF9F9]/98 flex flex-col items-center justify-center p-8 animate-in fade-in">
           <button onClick={() => setSelectedGalleryMedia(null)} className="absolute top-10 right-10 text-pink-300 hover:text-pink-500">
             <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           {selectedGalleryMedia.resourceType === 'image' ? (
             <Frame className="w-full max-w-4xl">
               <img src={selectedGalleryMedia.url} className="max-w-full max-h-[70vh] object-contain" />
             </Frame>
           ) : (
             <div className="p-2 bg-white border-2 border-pink-100 rounded-2xl shadow-2xl w-full max-w-4xl">
               <VideoPlayer src={selectedGalleryMedia.url} className="w-full max-h-[70vh]" autoPlay />
             </div>
           )}
           {selectedGalleryMedia.quote && <p className="mt-8 text-2xl serif italic text-[#5D4037]">"{selectedGalleryMedia.quote}"</p>}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="h-16 flex justify-between px-6 md:px-12 items-center z-40 bg-white/60 backdrop-blur-md border-t border-pink-100">
        <div className="flex w-32">
           {phase !== AppPhase.COUNTDOWN && phase !== AppPhase.CELEBRATION && (
             <button onClick={prevPhase} className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-300">Previous</button>
           )}
        </div>
        <button onClick={() => setPhase(AppPhase.GALLERY)} className="group flex flex-col items-center gap-1 -mt-4">
          <div className="text-pink-200 text-2xl animate-bounce">❀</div>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-pink-300">Archive</span>
        </button>
        <div className="flex w-32 justify-end">
           {phase !== AppPhase.COUNTDOWN && phase !== AppPhase.CELEBRATION && phase !== AppPhase.GALLERY && (
             <button onClick={nextPhase} className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-300">Next</button>
           )}
        </div>
      </div>

      {showAdmin && <AdminPanel config={config} onSave={handleAdminSave} onClose={() => setShowAdmin(false)} />}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #FFD1DC; border-radius: 10px; }
        .animate-in { animation: 500ms ease-out both; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoom-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .fade-in { animation-name: fade-in; }
        .zoom-in { animation-name: zoom-in; }
      `}</style>
    </div>
  );
};

export default App;