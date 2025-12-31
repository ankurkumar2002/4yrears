
import React, { useState, useEffect, useRef } from 'react';
import { AppPhase, SiteConfig, MediaAsset } from './types';
import { INITIAL_CONFIG } from './constants';
import AdminPanel from './components/AdminPanel';
import Confetti from './components/Confetti';
import Frame from './components/Frame';

/**
 * Stable Video Player component defined outside of App 
 * to prevent DOM recreation/flickering on every render.
 */
const VideoPlayer: React.FC<{ src: string, className?: string, autoPlay?: boolean }> = ({ src, className, autoPlay }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  return (
    <video 
      ref={videoRef}
      src={src} 
      className={`${className} cursor-pointer`} 
      controls 
      playsInline 
      preload="metadata"
      autoPlay={autoPlay}
      muted={autoPlay} // Browsers often block autoplay unless muted
      onClick={(e) => {
        e.stopPropagation(); // Prevent gallery click-through
        const v = e.currentTarget;
        if (v.paused) {
          v.play().catch(err => console.debug("Autoplay blocked:", err));
        } else {
          v.pause();
        }
      }}
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
  
  // MCQ state
  const [currentMcqIdx, setCurrentMcqIdx] = useState(0);
  const [mcqPhase, setMcqPhase] = useState<'question' | 'feedback' | 'animation'>('question');
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);

  // Moments state
  const [currentMomentIdx, setCurrentMomentIdx] = useState(0);

  // Photo Session state
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Gallery view state
  const [selectedGalleryMedia, setSelectedGalleryMedia] = useState<MediaAsset | null>(null);

  useEffect(() => {
    const target = new Date(config.celebrationDate).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        clearInterval(interval);
        if (phase === AppPhase.COUNTDOWN) {
          setCelebrationActive(true);
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

  const handleAdminSave = (newConfig: SiteConfig) => {
    setConfig(newConfig);
    localStorage.setItem('anniversary_config', JSON.stringify(newConfig));
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

  const getSessionMedia = () => {
    return config.media.filter(m => m.type === 'session');
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

  const isShowerActive = celebrationActive && [AppPhase.COUNTDOWN, AppPhase.CELEBRATION, AppPhase.MOMENTS].includes(phase);

  return (
    <div className="relative h-screen w-screen bg-[#FFF9F9] overflow-hidden flex flex-col text-[#5D4037]">
      <div className="absolute inset-0 bg-floral pointer-events-none opacity-20" />
      <Confetti active={isShowerActive} />

      {/* Admin Toggle */}
      <button onClick={() => setShowAdmin(true)} className="fixed bottom-6 right-6 z-[60] w-10 h-10 rounded-full bg-white/40 backdrop-blur border border-pink-100 text-pink-200 hover:text-pink-400 transition-all shadow-sm flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
      </button>

      <main className="flex-1 relative z-10 overflow-hidden">
        <div className="h-full w-full flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto overflow-x-hidden">
          
          {phase === AppPhase.COUNTDOWN && (
            <div className="flex flex-col items-center animate-in fade-in duration-1000 text-center">
              <h1 className="text-5xl md:text-6xl serif mb-4 italic text-pink-600">Waiting for the moment</h1>
              <div className="flex gap-4 md:gap-10 mt-10">
                {[{ label: 'Days', val: timeLeft.d }, { label: 'Hrs', val: timeLeft.h }, { label: 'Min', val: timeLeft.m }, { label: 'Sec', val: timeLeft.s }].map(t => (
                  <div key={t.label} className="flex flex-col items-center">
                    <span className="text-4xl md:text-5xl serif text-[#FF69B4] tabular-nums">{t.val.toString().padStart(2, '0')}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-pink-300 mt-2 font-bold">{t.label}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setCelebrationActive(true); setPhase(AppPhase.CELEBRATION); }} className="mt-16 px-10 py-3 bg-white border border-pink-100 text-pink-300 rounded-full text-[9px] uppercase tracking-widest font-black shadow-sm">Relive Us</button>
            </div>
          )}

          {phase === AppPhase.CELEBRATION && (
            <div className="flex flex-col items-center animate-in zoom-in duration-1000 text-center px-4">
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.5em] text-pink-300 mb-3 font-bold opacity-80">Happy New Year</span>
              <h2 className="text-6xl md:text-[8rem] serif italic text-pink-500 mb-2 leading-tight drop-shadow-sm">Happy Anniversary</h2>
              <span className="text-lg md:text-xl serif italic text-[#5D4037] opacity-50 tracking-wide font-light">Four Years</span>
              
              <button onClick={nextPhase} className="mt-16 px-14 py-4 bg-[#FFF0F5] text-pink-500 border border-pink-100 rounded-full uppercase text-[10px] tracking-widest font-black shadow-sm hover:bg-pink-100 transition-all">Open the Chapter</button>
            </div>
          )}

          {phase === AppPhase.MOMENTS && (
            <div className="w-full max-w-6xl flex flex-col items-center animate-in fade-in duration-700">
              {config.moments && config.moments[currentMomentIdx] ? (
                <div className="w-full flex flex-col items-center gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full items-center min-h-[400px]">
                    <div className="flex flex-col justify-center space-y-6 text-center md:text-left order-2 md:order-1">
                      <p className="text-3xl md:text-5xl serif italic text-[#5D4037] leading-[1.25] break-words">
                        "{config.moments[currentMomentIdx].description}"
                      </p>
                    </div>

                    <div className="flex justify-center order-1 md:order-2">
                      <Frame className="w-full max-w-sm md:max-w-md">
                        {getMediaFor('animation', config.moments[currentMomentIdx].id)[0] ? (
                          getMediaFor('animation', config.moments[currentMomentIdx].id)[0].resourceType === 'image' ? (
                            <img src={getMediaFor('animation', config.moments[currentMomentIdx].id)[0].url} className="w-full aspect-[4/5] object-cover" alt="Memory" />
                          ) : (
                            <VideoPlayer src={getMediaFor('animation', config.moments[currentMomentIdx].id)[0].url} className="w-full aspect-[4/5] object-cover" />
                          )
                        ) : (
                          <div className="w-full aspect-[4/5] bg-pink-50/20 flex items-center justify-center text-pink-200 serif italic text-lg text-center p-4">A Moment Captured</div>
                        )}
                      </Frame>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-6 mt-4 w-full">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setCurrentMomentIdx(p => Math.max(0, p-1))}
                        disabled={currentMomentIdx === 0}
                        className="w-10 h-10 flex items-center justify-center border border-pink-100 rounded-full bg-white text-pink-200 disabled:opacity-20 hover:text-pink-400 transition-all"
                      >
                        ←
                      </button>
                      <button 
                        onClick={() => currentMomentIdx < config.moments.length - 1 ? setCurrentMomentIdx(p => p + 1) : nextPhase()}
                        className="px-16 md:px-24 py-4 md:py-5 bg-[#FFF0F5] text-pink-500 rounded-full serif italic text-xl md:text-2xl hover:bg-pink-100 transition-all border border-pink-100 shadow-sm"
                      >
                        {currentMomentIdx < config.moments.length - 1 ? 'CONTINUE' : 'OUR MEMORIES'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center italic serif text-2xl text-pink-300">Start your story in the moments tab. <br/> <button onClick={nextPhase} className="mt-4 underline">Next Section</button></div>
              )}
            </div>
          )}

          {phase === AppPhase.MCQ && (
            <div className="w-full max-w-4xl flex flex-col items-center animate-in fade-in duration-700">
               {mcqPhase === 'question' && config.mcqs[currentMcqIdx] && (
                 <div className="w-full text-center space-y-12">
                   <span className="text-[9px] uppercase tracking-[0.4em] text-pink-300 font-bold opacity-80">A Shared Memory</span>
                   <h3 className="text-3xl md:text-4xl serif italic text-pink-700 px-4 leading-tight">"{config.mcqs[currentMcqIdx].question}"</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mx-auto px-4">
                     {config.mcqs[currentMcqIdx].options.map((opt, idx) => (
                       <button key={idx} onClick={() => handleAnswer(idx)} className="p-5 bg-white border border-pink-100 rounded-xl text-md md:text-lg serif italic hover:border-pink-300 transition-all shadow-sm">{opt}</button>
                     ))}
                   </div>
                 </div>
               )}
               {mcqPhase === 'feedback' && <div className="text-center text-4xl cursive text-pink-400">Yes, precisely...</div>}
               {mcqPhase === 'animation' && (
                 <div className="flex flex-col items-center space-y-8 w-full px-4">
                    <Frame className="max-w-2xl w-full">
                       {getMediaFor('mcq', config.mcqs[currentMcqIdx].id)[currentSceneIdx]?.resourceType === 'image' ? (
                         <img src={getMediaFor('mcq', config.mcqs[currentMcqIdx].id)[currentSceneIdx].url} className="w-full max-h-[55vh] object-contain" alt="MCQ Result" />
                       ) : (
                         <VideoPlayer src={getMediaFor('mcq', config.mcqs[currentMcqIdx].id)[currentSceneIdx]?.url} className="w-full max-h-[55vh] bg-black" />
                       )}
                    </Frame>
                    <div className="flex gap-6">
                       <button 
                        onClick={() => currentSceneIdx > 0 ? setCurrentSceneIdx(p => p - 1) : setMcqPhase('question')} 
                        className="px-10 py-2.5 border border-pink-100 rounded-full text-pink-400 font-medium hover:bg-pink-50 transition-all shadow-sm bg-white/50"
                       >
                         Back
                       </button>
                       <button 
                         onClick={() => {
                           const media = getMediaFor('mcq', config.mcqs[currentMcqIdx].id);
                           if (currentSceneIdx < media.length - 1) setCurrentSceneIdx(p => p + 1);
                           else currentMcqIdx < config.mcqs.length - 1 ? (setCurrentMcqIdx(p => p + 1), setMcqPhase('question')) : nextPhase();
                         }} 
                         className="px-14 py-2.5 bg-pink-500 text-white rounded-full shadow-lg font-bold hover:bg-pink-600 transition-all"
                       >
                         Next
                       </button>
                    </div>
                 </div>
               )}
            </div>
          )}

          {phase === AppPhase.PAUSE && (
            <div className="text-center space-y-12 animate-in fade-in duration-1000 max-w-3xl px-6">
              <span className="text-[9px] uppercase tracking-[0.4em] text-pink-300 font-bold">A Breath of Stillness</span>
              <p className="text-3xl md:text-4xl serif italic text-[#5D4037] leading-relaxed">
                {config.pauseMessage || "Take a deep breath. Let the world fade for a moment."}
              </p>
              <button onClick={nextPhase} className="px-12 py-3 bg-[#FFF0F5] text-pink-500 rounded-full uppercase text-[9px] tracking-widest font-black shadow-sm hover:bg-pink-100">Our Shared Moments</button>
            </div>
          )}

          {phase === AppPhase.PHOTOSESSION && (
            <div className="w-full h-full flex flex-col items-center animate-in fade-in duration-700">
               <span className="text-[9px] uppercase tracking-[0.4em] text-pink-300 font-bold mb-6 opacity-80">Our Media Session</span>
               <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center gap-6 px-4">
                 {getSessionMedia()[currentSlideIdx] ? (
                   <>
                     <Frame className="w-full max-w-3xl">
                       {getSessionMedia()[currentSlideIdx].resourceType === 'image' ? (
                         <img src={getSessionMedia()[currentSlideIdx].url} className="w-full max-h-[60vh] object-contain" alt="Slide" />
                       ) : (
                         <VideoPlayer key={getSessionMedia()[currentSlideIdx].id} src={getSessionMedia()[currentSlideIdx].url} className="w-full max-h-[60vh] bg-black" />
                       )}
                     </Frame>
                     {getSessionMedia()[currentSlideIdx].quote && (
                       <p className="text-lg md:text-xl serif italic text-[#5D4037] text-center max-w-xl px-4">"{getSessionMedia()[currentSlideIdx].quote}"</p>
                     )}
                   </>
                 ) : (
                    <div className="text-pink-200 serif text-lg italic py-20 text-center">Your media session is empty. <br/> Add memories in the Curator.</div>
                 )}
                 <div className="flex gap-6 mt-2 mb-6">
                   <button 
                    disabled={currentSlideIdx === 0} 
                    onClick={() => setCurrentSlideIdx(p => p - 1)} 
                    className="px-8 py-2 border border-pink-100 rounded-full text-pink-400 bg-white/50 disabled:opacity-20 transition-all"
                   >
                     Back
                   </button>
                   <button 
                    onClick={() => currentSlideIdx < getSessionMedia().length - 1 ? setCurrentSlideIdx(p => p + 1) : nextPhase()} 
                    className="px-12 py-2 bg-pink-500 text-white rounded-full shadow-lg font-bold uppercase tracking-widest text-xs"
                   >
                     {currentSlideIdx < getSessionMedia().length - 1 ? 'Next Memory' : 'Our Shared Promise'}
                   </button>
                 </div>
               </div>
            </div>
          )}

          {phase === AppPhase.PARTNER_SHARE && (
            <div className="max-w-4xl w-full text-center space-y-12 px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <span className="text-[10px] uppercase tracking-[0.5em] text-pink-300 font-bold opacity-80">A Moment for Us</span>
              <h2 className="text-5xl md:text-7xl serif italic text-pink-600 leading-tight">
                {config.partnerPrompt || "A Promise for the Future"}
              </h2>
              <div className="relative py-12 px-8">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-pink-100 rounded-tl-3xl opacity-50" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-pink-100 rounded-br-3xl opacity-50" />
                
                <p className="text-2xl md:text-4xl serif italic text-[#5D4037] leading-[1.6] max-w-3xl mx-auto drop-shadow-sm">
                  {config.partnerStaticMessage || "In the quiet of this moment, let us remember how far we've come and the beautiful unknown ahead of us."}
                </p>
              </div>
              <div className="flex flex-col items-center gap-8 pt-6">
                <div className="text-pink-100 text-3xl opacity-40">♥</div>
                <button 
                  onClick={nextPhase} 
                  className="px-16 py-4 bg-pink-500 text-white rounded-full shadow-lg font-bold text-xs uppercase tracking-widest hover:bg-pink-600 transition-all"
                >
                  Final Reflections
                </button>
              </div>
            </div>
          )}

          {phase === AppPhase.CLOSING && (
            <div className="text-center space-y-8 animate-in fade-in duration-3000 max-w-4xl px-6">
              <h2 className="text-6xl md:text-[8rem] cursive text-pink-500 mb-4 drop-shadow-sm">Always us.</h2>
              <p className="text-xl md:text-3xl serif italic text-[#5D4037] leading-relaxed max-w-2xl mx-auto opacity-90">{config.closingMessage}</p>
              <div className="pt-8">
                <div className="text-pink-200 text-2xl animate-pulse mb-8">♥</div>
                <button onClick={() => { setPhase(AppPhase.COUNTDOWN); setCelebrationActive(false); }} className="text-[8px] uppercase tracking-[0.4em] text-pink-200 hover:text-pink-400 font-bold transition-colors">Relive the Journey</button>
              </div>
            </div>
          )}

          {/* Fixed Gallery Phase */}
          {phase === AppPhase.GALLERY && (
            <div className="w-full h-full max-w-7xl mx-auto flex flex-col p-4 md:p-8 animate-in slide-in-from-bottom duration-700">
               <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 border-b border-pink-100 pb-6 gap-4">
                 <div className="text-center md:text-left">
                   <span className="text-[10px] uppercase tracking-[0.5em] text-pink-300 font-bold">The Archive</span>
                   <h2 className="text-4xl md:text-6xl serif italic text-pink-600">Our Shared Media</h2>
                 </div>
                 <button onClick={() => setPhase(AppPhase.CELEBRATION)} className="text-[10px] uppercase tracking-widest font-black text-pink-500 border border-pink-200 px-8 py-3 rounded-full bg-white hover:bg-pink-50 transition-all shadow-sm">Close Archive</button>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 pb-20">
                   {config.media.map((m) => (
                     <div 
                      key={m.id} 
                      onClick={() => setSelectedGalleryMedia(m)}
                      className="relative aspect-square bg-white border border-pink-100 rounded-lg overflow-hidden cursor-zoom-in group shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300"
                     >
                       {m.resourceType === 'image' ? (
                         <img src={m.url} className="w-full h-full object-cover" alt="Memory" loading="lazy" />
                       ) : (
                         <div className="w-full h-full bg-black relative flex items-center justify-center">
                           <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                           </div>
                           <video src={`${m.url}#t=0.1`} className="w-full h-full object-cover opacity-70" />
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

      {/* Media Lightbox/Modal */}
      {selectedGalleryMedia && (
        <div className="fixed inset-0 z-[100] bg-[#FFF9F9]/98 flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
           <button onClick={() => setSelectedGalleryMedia(null)} className="absolute top-6 right-6 md:top-10 md:right-10 text-pink-300 hover:text-pink-500 transition-all z-[110]">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           <div className="max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6">
             <div className="relative w-full flex-1 flex items-center justify-center">
                <Frame className="w-full max-h-[75vh] flex items-center justify-center overflow-hidden">
                  {selectedGalleryMedia.resourceType === 'image' ? (
                    <img src={selectedGalleryMedia.url} className="max-w-full max-h-[70vh] object-contain" alt="Selected memory" />
                  ) : (
                    <VideoPlayer key={selectedGalleryMedia.id} src={selectedGalleryMedia.url} className="max-w-full max-h-[70vh] bg-black shadow-inner" autoPlay />
                  )}
                </Frame>
             </div>
             {selectedGalleryMedia.quote && (
               <p className="text-xl md:text-3xl serif italic text-[#5D4037] text-center max-w-3xl px-6 py-4 animate-in slide-in-from-bottom duration-500 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm">
                 "{selectedGalleryMedia.quote}"
               </p>
             )}
           </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="h-16 flex justify-between px-6 md:px-12 items-center z-40 bg-white/60 backdrop-blur-md border-t border-pink-100">
        <div className="flex w-32">
           {phase !== AppPhase.COUNTDOWN && phase !== AppPhase.CELEBRATION && (
             <button onClick={prevPhase} className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-300 hover:text-pink-500 transition-all">Previous</button>
           )}
        </div>
        
        <button 
          onClick={() => setPhase(AppPhase.GALLERY)}
          className="group flex flex-col items-center gap-1 -mt-4 transition-all hover:scale-110 active:scale-95"
        >
          <div className="text-pink-200 text-2xl transition-colors group-hover:text-pink-500 animate-bounce">❀</div>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-pink-300 group-hover:text-pink-600">The Archive</span>
        </button>

        <div className="flex w-32 justify-end">
           {phase !== AppPhase.COUNTDOWN && phase !== AppPhase.CELEBRATION && phase !== AppPhase.GALLERY && (
             <button onClick={nextPhase} className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-300 hover:text-pink-500 transition-all">Next</button>
           )}
        </div>
      </div>

      {showAdmin && <AdminPanel config={config} onSave={handleAdminSave} onClose={() => setShowAdmin(false)} />}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 182, 193, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #FFD1DC; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF69B4; }
        
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-bottom { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-in { animation: var(--tw-duration, 500ms) ease-out both; }
        .fade-in { animation-name: fade-in; }
        .slide-in-from-bottom { animation-name: slide-in-from-bottom; }
      `}</style>
    </div>
  );
};

export default App;
