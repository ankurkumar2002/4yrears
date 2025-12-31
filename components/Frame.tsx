
import React from 'react';

interface FrameProps {
  children: React.ReactNode;
  className?: string;
  caption?: string;
}

const Frame: React.FC<FrameProps> = ({ children, className = '', caption }) => {
  return (
    <div className={`relative group ${className}`}>
      {/* Soft Glow Background */}
      <div className="absolute -inset-2 bg-pink-100/50 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative p-3 bg-white border-2 border-pink-100 rounded-lg shadow-xl transition-transform duration-700 hover:scale-[1.01]">
        <div className="overflow-hidden rounded-md relative border border-pink-50">
          {children}
          {/* Subtle warm overlay */}
          <div className="absolute inset-0 bg-pink-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>
      
      {caption && (
        <p className="mt-4 text-center text-[#FF69B4] serif italic text-lg font-medium">
          {caption}
        </p>
      )}
      
      {/* Floral Decorative SVGs */}
      <div className="absolute -top-3 -left-3 w-8 h-8 text-pink-300 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2L13,9H11L12,2M19,4L16,10.5L17.5,11.5L21,6L19,4M5,4L3,6L6.5,11.5L8,10.5L5,4M22,12L15,13V11L22,12M2,12L9,11V13L2,12M19,20L21,18L17.5,12.5L16,13.5L19,20M5,20L8,13.5L6.5,12.5L3,18L5,20M12,22L11,15H13L12,22Z"/></svg>
      </div>
      <div className="absolute -bottom-3 -right-3 w-8 h-8 text-pink-300 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity rotate-180">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2L13,9H11L12,2M19,4L16,10.5L17.5,11.5L21,6L19,4M5,4L3,6L6.5,11.5L8,10.5L5,4M22,12L15,13V11L22,12M2,12L9,11V13L2,12M19,20L21,18L17.5,12.5L16,13.5L19,20M5,20L8,13.5L6.5,12.5L3,18L5,20M12,22L11,15H13L12,22Z"/></svg>
      </div>
    </div>
  );
};

export default Frame;
