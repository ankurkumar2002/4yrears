
import { SiteConfig } from './types';

export const COLORS = {
  background: '#FFF9F9',
  text: '#5D4037',
  accent: '#FF69B4', // Hot Pink
  accentSoft: 'rgba(255, 105, 180, 0.1)',
  gold: '#D4AF37'
};

// Default celebration date set to New Year's 12:00 AM (assuming Jan 1, 2026 for a future target, or dynamic)
// For demonstration, setting it to a near future date if not specifically provided.
export const TARGET_DATE = '2026-01-01T00:00:00Z';

export const INITIAL_CONFIG: SiteConfig = {
  adminPasswordHash: 'admin123',
  celebrationDate: TARGET_DATE,
  closingMessage: "Four years have only confirmed what my heart knew from the start. I love you more with every passing second. Happy Anniversary, and Happy New Year.",
  pauseMessage: "Take a deep breath. Let the world fade for a moment. This space is just for us, celebrating every step of the last four years.",
  partnerPrompt: "Our Shared Future",
  partnerStaticMessage: "As we screenshare and look back at these memories together, let's remember that the best chapters are yet to be written. Here's to us, to four years of growth, and to a lifetime of love.",
  cloudinaryCloudName: 'drtxmi9jm', 
  cloudinaryUploadPreset: 'ml_default', // User must ensure an 'Unsigned' upload preset named 'ml_default' exists in Cloudinary dashboard
  mcqs: [
    {
      id: 'mcq_1',
      question: "Which moment in our first year made you realize we were meant for something special?",
      options: ["Our first midnight walk", "The first time we cooked together", "That rain-soaked afternoon", "Simply sitting in silence"],
      correctAnswer: 0
    }
  ],
  media: [],
  moments: [
    { id: '1', description: "Four years ago, the world became a little brighter because you walked into my life." }
  ]
};
