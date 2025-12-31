
import React, { useState } from 'react';
import { SiteConfig, MCQ, MediaAsset, MomentData } from '../types';
import { cloudinaryService } from '../services/cloudinaryService';

interface AdminPanelProps {
  config: SiteConfig;
  onSave: (newConfig: SiteConfig) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ config, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'moments' | 'mcq' | 'session' | 'audio'>('settings');
  const [localConfig, setLocalConfig] = useState<SiteConfig>(config);

  const handleCloudinaryUpload = (type: MediaAsset['type'], linkedToId?: string) => {
    if (!localConfig.cloudinaryCloudName) {
      alert("Please enter your Cloudinary Cloud Name in Settings first.");
      return;
    }

    cloudinaryService.openWidget(
      localConfig.cloudinaryCloudName,
      localConfig.cloudinaryUploadPreset || 'ml_default',
      (info: any) => {
        const newAsset: MediaAsset = {
          id: info.public_id,
          url: info.secure_url,
          publicId: info.public_id,
          type,
          resourceType: info.resource_type as 'image' | 'video',
          linkedToId,
          order: localConfig.media.length + 1,
          createdAt: new Date().toISOString()
        };
        setLocalConfig(prev => ({
          ...prev,
          media: [...prev.media, newAsset]
        }));
      }
    );
  };

  const handleAudioUpload = () => {
    if (!localConfig.cloudinaryCloudName) {
      alert("Please enter your Cloudinary Cloud Name in Settings first.");
      return;
    }

    cloudinaryService.openWidget(
      localConfig.cloudinaryCloudName,
      localConfig.cloudinaryUploadPreset || 'ml_default',
      (info: any) => {
        // Cloudinary returns secure_url for the uploaded audio file
        const urls = [...(localConfig.backgroundMusicUrls || [])];
        urls.push(info.secure_url);
        setLocalConfig({ ...localConfig, backgroundMusicUrls: urls });
      }
    );
  };

  const addMoment = () => {
    const newMoment: MomentData = { id: Date.now().toString(), description: "Share a beautiful thought here..." };
    setLocalConfig({...localConfig, moments: [...localConfig.moments, newMoment]});
  };

  const removeMoment = (id: string) => {
    setLocalConfig({
      ...localConfig, 
      moments: localConfig.moments.filter(m => m.id !== id),
      media: localConfig.media.filter(m => !(m.type === 'animation' && m.linkedToId === id))
    });
  };

  const addMcq = () => {
    const newMcq: MCQ = {
      id: Date.now().toString(),
      question: "Enter your question here...",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: 0
    };
    setLocalConfig({...localConfig, mcqs: [...localConfig.mcqs, newMcq]});
  };

  const getAssetsFor = (type: MediaAsset['type'], id?: string) => {
    return localConfig.media.filter(m => m.type === type && (id ? m.linkedToId === id : true));
  };

  const addSongUrl = () => {
    const urls = [...(localConfig.backgroundMusicUrls || [])];
    urls.push("");
    setLocalConfig({ ...localConfig, backgroundMusicUrls: urls });
  };

  const updateSongUrl = (idx: number, val: string) => {
    const urls = [...(localConfig.backgroundMusicUrls || [])];
    urls[idx] = val;
    setLocalConfig({ ...localConfig, backgroundMusicUrls: urls });
  };

  const removeSongUrl = (idx: number) => {
    const urls = (localConfig.backgroundMusicUrls || []).filter((_, i) => i !== idx);
    setLocalConfig({ ...localConfig, backgroundMusicUrls: urls });
  };

  return (
    <div className="fixed inset-0 bg-white/95 z-[100] p-4 flex flex-col items-center">
      <div className="max-w-6xl w-full flex-1 bg-white border border-pink-100 rounded-xl flex flex-col overflow-hidden shadow-2xl text-[#5D4037]">
        <div className="p-6 border-b border-pink-100 flex justify-between items-center bg-pink-50/30">
          <h2 className="text-2xl serif text-[#FF69B4] font-medium italic">Memory Curator</h2>
          <div className="flex gap-3">
            <button onClick={() => onSave(localConfig)} className="px-6 py-2 bg-[#FF69B4] text-white rounded-full text-sm font-medium hover:bg-[#FF1493] transition-all shadow-md">Save All Changes</button>
            <button onClick={onClose} className="px-6 py-2 border border-pink-200 text-pink-400 rounded-full text-sm hover:bg-pink-50 transition-all">Cancel</button>
          </div>
        </div>

        <div className="flex border-b border-pink-100 bg-pink-50/20 overflow-x-auto">
          {(['settings', 'moments', 'mcq', 'session', 'audio'] as const).map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-xs uppercase tracking-widest transition-all font-medium whitespace-nowrap ${activeTab === tab ? 'text-[#FF69B4] border-b-2 border-[#FF69B4] bg-white' : 'text-pink-300 hover:text-pink-500'}`}
            >
              {tab === 'mcq' ? 'Games' : tab === 'session' ? 'Media' : tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'settings' && (
            <div className="max-w-3xl space-y-10">
              <div className="bg-pink-50/50 p-6 rounded-2xl border border-pink-100">
                <h4 className="text-xs font-black uppercase tracking-widest text-pink-400 mb-4">Cloudinary Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-pink-400 uppercase tracking-widest block mb-1">Cloud Name</label>
                    <input className="w-full bg-white border border-pink-100 p-3 rounded-lg" value={localConfig.cloudinaryCloudName} onChange={(e) => setLocalConfig({...localConfig, cloudinaryCloudName: e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-[10px] text-pink-400 uppercase tracking-widest block mb-1">Upload Preset (Unsigned)</label>
                    <input className="w-full bg-white border border-pink-100 p-3 rounded-lg font-mono text-xs" value={localConfig.cloudinaryUploadPreset} placeholder="e.g. ml_default" onChange={(e) => setLocalConfig({...localConfig, cloudinaryUploadPreset: e.target.value})}/>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-pink-400 uppercase tracking-widest block">Anniversary / Midnight Time (UTC)</label>
                <input type="datetime-local" className="w-full bg-white border border-pink-100 p-3 rounded-lg" value={localConfig.celebrationDate.slice(0, 16)} onChange={(e) => setLocalConfig({...localConfig, celebrationDate: new Date(e.target.value).toISOString()})}/>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-pink-400 uppercase tracking-widest block">Closing Reflection</label>
                <textarea className="w-full bg-pink-50/30 border border-pink-100 p-4 rounded-xl text-sm italic h-24" value={localConfig.closingMessage} onChange={(e) => setLocalConfig({...localConfig, closingMessage: e.target.value})}/>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
              <h3 className="text-2xl serif italic text-pink-600">The Sound of Us</h3>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl space-y-2">
                <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">⚠️ Important Note on URLs</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  The link must be a <strong>direct file link</strong> (ending in .mp3 or .wav). 
                  <br/><br/>
                  <strong>Good news:</strong> You can now <strong>upload your own songs</strong> directly! Just click the "Upload Song" button below.
                </p>
              </div>
              
              <div className="space-y-6 bg-pink-50/30 p-8 rounded-2xl border border-pink-100">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] text-pink-400 uppercase tracking-widest block">Background Playlist</label>
                    <div className="flex gap-2">
                      <button onClick={handleAudioUpload} className="text-[10px] bg-pink-500 text-white px-4 py-1 rounded-full hover:bg-pink-600 uppercase font-black tracking-widest shadow-sm transition-all">↑ Upload Song</button>
                      <button onClick={addSongUrl} className="text-[10px] bg-pink-100 text-pink-500 px-3 py-1 rounded-full hover:bg-pink-200 uppercase font-black tracking-widest">+ Add URL</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(localConfig.backgroundMusicUrls || []).map((url, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          className="flex-1 bg-white border border-pink-100 p-3 rounded-xl text-xs italic" 
                          placeholder="https://example.com/song.mp3"
                          value={url} 
                          onChange={(e) => updateSongUrl(idx, e.target.value)}
                        />
                        <button onClick={() => removeSongUrl(idx)} className="text-red-300 hover:text-red-500 p-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                    {(localConfig.backgroundMusicUrls || []).length === 0 && (
                      <p className="text-xs text-pink-300 italic">No songs added. Upload your first song to start your playlist.</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-pink-400 uppercase tracking-widest block mb-2">Midnight Celebration Sound Effect</label>
                  <input 
                    className="w-full bg-white border border-pink-100 p-4 rounded-xl text-sm italic" 
                    placeholder="https://example.com/popper.mp3"
                    value={localConfig.celebrationSfxUrl || ''} 
                    onChange={(e) => setLocalConfig({...localConfig, celebrationSfxUrl: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'moments' && (
            <div className="space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl serif italic text-pink-600">Reflection Moments</h3>
                <button onClick={addMoment} className="px-4 py-2 bg-pink-50 text-pink-500 border border-pink-200 rounded-full text-xs uppercase tracking-widest hover:bg-pink-100">+ Add Moment</button>
              </div>
              <div className="grid gap-8">
                {localConfig.moments.map((m, idx) => (
                  <div key={m.id} className="p-6 md:p-8 bg-pink-50/30 rounded-2xl border border-pink-100 flex flex-col md:flex-row gap-8 relative">
                    <button onClick={() => removeMoment(m.id)} className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-red-300 hover:text-red-500">Remove</button>
                    <div className="flex-1">
                      <label className="text-[10px] text-pink-400 uppercase tracking-widest block mb-2">Moment Quote #{idx + 1}</label>
                      <textarea className="w-full bg-white border border-pink-100 p-4 rounded-lg text-lg serif italic h-32" value={m.description} onChange={(e) => {
                        const updated = localConfig.moments.map(item => item.id === m.id ? { ...item, description: e.target.value } : item);
                        setLocalConfig({ ...localConfig, moments: updated });
                      }}/>
                    </div>
                    <div className="md:w-64">
                      <label className="text-[10px] text-pink-400 uppercase tracking-widest block mb-3">Media for Moment</label>
                      <div className="flex flex-wrap gap-2">
                        {getAssetsFor('animation', m.id).map(asset => (
                          <div key={asset.id} className="w-20 h-20 bg-white border border-pink-100 rounded relative group overflow-hidden shadow-sm">
                            {asset.resourceType === 'image' ? <img src={asset.url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black flex items-center justify-center text-white text-[8px] font-bold">VIDEO</div>}
                            <button onClick={() => setLocalConfig({...localConfig, media: localConfig.media.filter(a => a.id !== asset.id)})} className="absolute inset-0 bg-red-400/90 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[8px] font-black uppercase">Delete</button>
                          </div>
                        ))}
                        <button onClick={() => handleCloudinaryUpload('animation', m.id)} className="w-20 h-20 border-2 border-dashed border-pink-100 rounded flex items-center justify-center text-pink-200 hover:text-pink-400 hover:border-pink-200 transition-colors">+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'mcq' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl serif italic text-pink-600">Memory Games</h3>
                <button onClick={addMcq} className="px-4 py-2 bg-pink-50 text-pink-500 border border-pink-200 rounded-full text-xs uppercase tracking-widest">+ Add Game</button>
              </div>
              <div className="grid gap-8">
                {localConfig.mcqs.map((mcq, idx) => (
                  <div key={mcq.id} className="p-8 bg-pink-50/30 rounded-2xl border border-pink-100 space-y-6 relative">
                    <button onClick={() => setLocalConfig({...localConfig, mcqs: localConfig.mcqs.filter(m => m.id !== mcq.id)})} className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-red-300">Remove</button>
                    <div className="space-y-2">
                      <label className="text-[10px] text-pink-400 uppercase tracking-widest block">Question #{idx + 1}</label>
                      <input className="w-full bg-white border border-pink-100 p-3 rounded-lg serif text-2xl italic" value={mcq.question} onChange={(e) => {
                        const updated = localConfig.mcqs.map(m => m.id === mcq.id ? {...m, question: e.target.value} : m);
                        setLocalConfig({...localConfig, mcqs: updated});
                      }}/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mcq.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <input type="radio" checked={mcq.correctAnswer === oIdx} onChange={() => {
                            const updated = localConfig.mcqs.map(m => m.id === mcq.id ? {...m, correctAnswer: oIdx} : m);
                            setLocalConfig({...localConfig, mcqs: updated});
                          }} className="accent-pink-500"/>
                          <input className="flex-1 p-2 border border-pink-100 rounded text-sm" value={opt} onChange={(e) => {
                            const updated = localConfig.mcqs.map(m => m.id === mcq.id ? { ...m, options: m.options.map((o, k) => k === oIdx ? e.target.value : o) } : m);
                            setLocalConfig({...localConfig, mcqs: updated});
                          }}/>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-pink-100/50">
                      <label className="text-[10px] text-pink-400 uppercase tracking-widest block mb-2">Media for this Game</label>
                      <div className="flex gap-4 flex-wrap">
                        {getAssetsFor('mcq', mcq.id).map(a => (
                          <div key={a.id} className="w-24 h-24 bg-white border border-pink-100 rounded overflow-hidden group relative shadow-sm">
                            {a.resourceType === 'image' ? <img src={a.url} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-black flex items-center justify-center text-white text-[8px] font-bold">VIDEO</div>}
                            <button onClick={() => setLocalConfig({...localConfig, media: localConfig.media.filter(m => m.id !== a.id)})} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[8px] font-black">Delete</button>
                          </div>
                        ))}
                        <button onClick={() => handleCloudinaryUpload('mcq', mcq.id)} className="w-24 h-24 border-2 border-dashed border-pink-200 text-pink-200 rounded flex items-center justify-center transition-colors hover:text-pink-400">+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'session' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl serif italic text-pink-600">The Media Session</h3>
                <button onClick={() => handleCloudinaryUpload('session')} className="px-6 py-2 bg-pink-50 text-pink-500 border border-pink-200 rounded-full text-xs uppercase tracking-widest hover:bg-pink-100">Upload New</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {getAssetsFor('session').map(asset => (
                  <div key={asset.id} className="aspect-square bg-white border border-pink-100 rounded-xl relative group overflow-hidden shadow-sm">
                    {asset.resourceType === 'image' ? <img src={asset.url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black flex items-center justify-center text-white text-[10px] font-black uppercase italic">Video</div>}
                    <div className="absolute inset-0 bg-pink-500/30 opacity-0 group-hover:opacity-100 flex items-center justify-center p-2 transition-opacity">
                       <button onClick={() => setLocalConfig({...localConfig, media: localConfig.media.filter(m => m.id !== asset.id)})} className="bg-white text-pink-500 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg">Delete</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => handleCloudinaryUpload('session')} className="aspect-square border-2 border-dashed border-pink-100 text-pink-200 rounded-xl flex items-center justify-center text-3xl hover:border-pink-300 hover:text-pink-400 transition-colors">+</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
