'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, X, Maximize2 } from 'lucide-react';
import { MediaItem } from '../types/xPost';

interface XMediaGridProps {
  media: MediaItem[];
}

export const XMediaGrid: React.FC<XMediaGridProps> = ({ media }) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!media || media.length === 0) return null;

  const handleVideoToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 1;
      setProgress((current / total) * 100);
    }
  };

  // Video Media Rendering
  const videoItem = media.find((m) => m.type === 'video');
  if (videoItem) {
    return (
      <div className="relative mt-3 rounded-2xl overflow-hidden border border-[#2f3336] bg-black max-h-[420px] group">
        <video
          ref={videoRef}
          src={videoItem.url}
          poster={videoItem.thumbnail}
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-cover cursor-pointer max-h-[420px]"
          onClick={handleVideoToggle}
        />

        {/* Play/Pause Overlay Button */}
        {!isPlaying && (
          <div
            onClick={handleVideoToggle}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity group-hover:bg-black/40"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 rounded-full bg-[#1d9bf0] text-white flex items-center justify-center shadow-2xl pl-1"
            >
              <Play className="w-8 h-8 fill-current" />
            </motion.div>
          </div>
        )}

        {/* Video Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleVideoToggle}
            className="text-white hover:text-[#1d9bf0] transition-colors p-1"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          {/* Progress Bar */}
          <div className="flex-1 mx-3 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer">
            <div className="h-full bg-[#1d9bf0] transition-all" style={{ width: `${progress}%` }} />
          </div>

          {/* Duration Badge */}
          <span className="text-white text-xs font-mono mr-2">
            {videoItem.duration || '0:30'}
          </span>

          {/* Mute Toggle */}
          <button
            onClick={handleMuteToggle}
            className="text-white hover:text-[#1d9bf0] transition-colors p-1"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }

  // GIF Media Rendering
  const gifItem = media.find((m) => m.type === 'gif');
  if (gifItem) {
    return (
      <div className="relative mt-3 rounded-2xl overflow-hidden border border-[#2f3336] max-h-[380px] bg-black">
        <img
          src={gifItem.url}
          alt="GIF content"
          className="w-full h-full object-cover max-h-[380px] cursor-pointer"
          onClick={() => setSelectedMedia(gifItem)}
        />
        <div className="absolute bottom-3 left-3 bg-black/75 text-white font-bold text-[11px] px-2 py-0.5 rounded tracking-wider backdrop-blur-md">
          GIF
        </div>
      </div>
    );
  }

  // Image Grid Layout (1 to 4 images)
  const images = media.filter((m) => m.type === 'image');
  const count = images.length;

  return (
    <>
      <div className="mt-3 rounded-2xl overflow-hidden border border-[#2f3336] bg-[#000000]">
        {count === 1 && (
          <div className="max-h-[510px] w-full overflow-hidden">
            <img
              src={images[0].url}
              alt={images[0].alt || 'Post media'}
              className="w-full h-full object-cover max-h-[510px] hover:opacity-95 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMedia(images[0]);
              }}
            />
          </div>
        )}

        {count === 2 && (
          <div className="grid grid-cols-2 gap-0.5 aspect-[16/9] w-full">
            {images.map((img) => (
              <div key={img.id} className="h-full overflow-hidden">
                <img
                  src={img.url}
                  alt={img.alt || 'Post media'}
                  className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMedia(img);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {count === 3 && (
          <div className="grid grid-cols-2 gap-0.5 aspect-[16/9] w-full">
            <div className="h-full overflow-hidden">
              <img
                src={images[0].url}
                alt={images[0].alt || 'Post media'}
                className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMedia(images[0]);
                }}
              />
            </div>
            <div className="grid grid-rows-2 gap-0.5 h-full">
              {images.slice(1, 3).map((img) => (
                <div key={img.id} className="h-full overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.alt || 'Post media'}
                    className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMedia(img);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {count >= 4 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[16/9] w-full">
            {images.slice(0, 4).map((img) => (
              <div key={img.id} className="h-full overflow-hidden">
                <img
                  src={img.url}
                  alt={img.alt || 'Post media'}
                  className="w-full h-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMedia(img);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMedia(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-black/50 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={selectedMedia.url}
              alt="Lightbox media preview"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
