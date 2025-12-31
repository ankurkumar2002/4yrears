
export enum AppPhase {
  COUNTDOWN = 'COUNTDOWN',
  CELEBRATION = 'CELEBRATION',
  MOMENTS = 'MOMENTS',
  MCQ = 'MCQ',
  PAUSE = 'PAUSE',
  PHOTOSESSION = 'PHOTOSESSION',
  PARTNER_SHARE = 'PARTNER_SHARE',
  CLOSING = 'CLOSING'
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
  partnerPrompt?: string; // Heading for the share section
  partnerStaticMessage?: string; // Static content for the share section
  mcqs: MCQ[];
  media: MediaAsset[];
  moments: MomentData[];
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
}
