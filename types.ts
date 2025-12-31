
export enum AppPhase {
  COUNTDOWN = 'COUNTDOWN',
  CELEBRATION = 'CELEBRATION',
  MOMENTS = 'MOMENTS',
  MCQ = 'MCQ',
  PAUSE = 'PAUSE',
  PHOTOSESSION = 'PHOTOSESSION',
  PARTNER_SHARE = 'PARTNER_SHARE',
  CLOSING = 'CLOSING',
  GALLERY = 'GALLERY'
}

export interface MediaAsset {
  id: string;
  url: string;
  publicId: string;
  type: 'mcq' | 'animation' | 'session'; 
  resourceType: 'image' | 'video';
  linkedToId?: string; 
  order: number;
  quote?: string;
  createdAt: string;
}

export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface MomentData {
  id: string;
  description: string;
}

export interface SiteConfig {
  adminPasswordHash: string;
  celebrationDate: string;
  closingMessage?: string;
  pauseMessage?: string;
  partnerPrompt?: string; 
  partnerStaticMessage?: string; 
  backgroundMusicUrl?: string;
  celebrationSfxUrl?: string;
  mcqs: MCQ[];
  media: MediaAsset[];
  moments: MomentData[];
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
}
