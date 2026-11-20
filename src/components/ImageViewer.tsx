import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Eye, ZoomIn, ZoomOut, RotateCcw, Download, Play } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { isVideoMedia, extractVideoInfo } from '../lib/videoUtils';

interface ImageViewerProps {
  images: string[];
  label: string;
  triggerText?: string;
  children?: React.ReactNode;
  initialIndex?: number;
}

export default function ImageViewer({ images, label, triggerText, children, initialIndex }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const { language } = useLanguage();

  const resolveTargetIndex = () => {
    const videoIdx = images.findIndex(isVideoMedia);
    // If a video exists in the gallery, ALWAYS prioritize playing the video first
    // when clicked from the project card or "Watch Video" trigger!
    if (videoIdx !== -1) {
      if (typeof initialIndex === 'number' && initialIndex > 0 && initialIndex < images.length) {
        return initialIndex;
      }
      return videoIdx;
    }
    if (typeof initialIndex === 'number' && initialIndex >= 0 && initialIndex < images.length) {
      return initialIndex;
    }
    return 0;
  };

  const [currentIndex, setCurrentIndex] = useState(() => resolveTargetIndex());

  const openViewer = () => {
    setCurrentIndex(resolveTargetIndex());
    setZoomScale(1);
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(resolveTargetIndex());
    }
  }, [isOpen, initialIndex, images]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Reset zoom when image changes or viewer opens/closes
    setZoomScale(1);
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!images || images.length === 0) return null;

  const currentMedia = images[currentIndex] || '';
  const isPdf = currentMedia.toLowerCase().includes('.pdf') || currentMedia.toLowerCase().split('?')[0].endsWith('.pdf');
  const isVideo = isVideoMedia(currentMedia);
  const videoInfo = isVideo ? extractVideoInfo(currentMedia) : null;

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  const zoomIn = () => setZoomScale(s => Math.min(s + 0.25, 3));
  const zoomOut = () => setZoomScale(s => Math.max(s - 0.25, 0.5));
  const resetZoom = () => setZoomScale(1);

  return (
    <>
      {children ? (
        <div onClick={openViewer} className="cursor-pointer w-full h-full">
          {children}
        </div>
      ) : (
        <button 
          onClick={openViewer}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/15 transition-all group mt-2"
        >
          {images.some(isVideoMedia) ? (
            <Play className="w-4 h-4 fill-blue-500 text-blue-500 group-hover:scale-110 transition-transform" />
          ) : (
            <Eye className="w-4 h-4 group-hover:scale-110 transition-transform text-blue-500" />
          )}
          <span>{triggerText || `Show ${label}`}</span>
        </button>
      )}

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
                if (e.key === 'ArrowRight') next();
                if (e.key === 'ArrowLeft') prev();
              }}
              tabIndex={0}
            >
              {/* Close Button on top corner */}
              <button 
                onClick={() => setIsOpen(false)}
                className="fixed top-4 end-4 sm:top-6 sm:end-6 p-2.5 sm:p-3 bg-white/15 hover:bg-white/25 rounded-full transition-colors z-[110] cursor-pointer"
                title="Close Viewer"
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </button>

              {/* Main Interactive Zoom Panel Card */}
              <motion.div 
                initial={{ y: '100vh', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100vh', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                className="w-full max-w-5xl h-[90vh] bg-white dark:bg-[#0c0c0e] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col border border-gray-200 dark:border-white/10"
              >
                {/* Card Header */}
                <div className="flex justify-between items-center px-5 sm:px-8 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02]">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400 mb-0.5">{label}</p>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                      <span>{isPdf ? 'Document' : isVideo ? 'Video' : 'Image'} {currentIndex + 1} / {images.length}</span>
                    </h4>
                  </div>

                  {/* Zoom Controls (only for images) */}
                  {!isPdf && !isVideo && (
                    <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-xl p-1 border border-gray-200 dark:border-white/10 gap-1">
                      <button 
                        onClick={zoomOut}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-700 dark:text-white cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] text-gray-600 dark:text-white/70 font-mono px-2 min-w-[46px] text-center">
                        {Math.round(zoomScale * 100)}%
                      </span>
                      <button 
                        onClick={zoomIn}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-700 dark:text-white cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={resetZoom}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-700 dark:text-white cursor-pointer"
                        title="Reset Zoom"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* If PDF and mobile, show the helper top bar */}
                {isPdf && isMobile && (
                  <div className="p-4 bg-[#1C1C1E] dark:bg-[#0c0c0e] border-b border-gray-200 dark:border-white/10 flex flex-col gap-3">
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                        {label} {language === 'en' ? 'Document' : 'مستند'}
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1 px-4 leading-normal font-medium">
                        {language === 'en' 
                          ? 'Mobile browsers may restrict inline PDF viewing. For the absolute best reading experience with full pinch-to-zoom, use the options below:' 
                          : 'قد تفرض متصفحات الهاتف قيودًا على عرض ملفات PDF. للحصول على أفضل تجربة قراءة مع ميزة التكبير والتصغير الكاملة، استخدم الخيارات أدناه:'}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 w-full">
                      <a 
                        href={images[currentIndex]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl transition-all text-xs uppercase tracking-wider text-center"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{language === 'en' ? 'Open Fullscreen' : 'فتح ملء الشاشة'}</span>
                      </a>
                      <a 
                        href={images[currentIndex]}
                        download={`${label}.pdf`}
                        className="flex-1 flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-3 rounded-xl transition-all text-xs uppercase tracking-wider text-center border border-white/10"
                      >
                        <Download className="w-4 h-4" />
                        <span>{language === 'en' ? 'Download PDF' : 'تحميل الملف'}</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Media Frame Body */}
                <div className="flex-1 flex items-center justify-center overflow-auto p-4 md:p-8 bg-gray-50 dark:bg-black/40 relative">
                  {/* Desktop controls overlay for PDF */}
                  {isPdf && !isMobile && (
                    <div className="absolute top-4 start-4 flex gap-2 z-10">
                      <a 
                        href={images[currentIndex]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-black/85 backdrop-blur-md hover:bg-black text-[10px] font-black uppercase tracking-widest text-white border border-white/10 rounded-lg flex items-center gap-1.5 transition-all"
                        title="Open in new tab"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Fullscreen</span>
                      </a>
                      <a 
                        href={images[currentIndex]}
                        download={`${label}.pdf`}
                        className="px-3 py-1.5 bg-black/85 backdrop-blur-md hover:bg-black text-[10px] font-black uppercase tracking-widest text-white border border-white/10 rounded-lg flex items-center gap-1.5 transition-all"
                        title={`Download ${label}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  )}

                  {isPdf ? (
                    <iframe
                      src={isMobile 
                        ? `https://docs.google.com/gview?url=${encodeURIComponent(images[currentIndex].startsWith('http') ? images[currentIndex] : `${window.location.origin}${images[currentIndex]}`)}&embedded=true`
                        : `${images[currentIndex]}#toolbar=0`
                      }
                      className="w-full max-w-[95%] h-[65vh] md:h-[75vh] rounded-2xl shadow-xl bg-white dark:bg-zinc-900 border-none"
                      title={`${label} PDF - ${currentIndex + 1}`}
                    />
                  ) : isVideo ? (
                    videoInfo?.type === 'youtube' && videoInfo.embedUrl ? (
                      <iframe
                        src={`${videoInfo.embedUrl}?autoplay=1&rel=0`}
                        className="w-full max-w-[95%] h-[65vh] md:h-[75vh] rounded-2xl shadow-2xl bg-black border border-white/10"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`${label} Video - ${currentIndex + 1}`}
                      />
                    ) : videoInfo?.type === 'vimeo' && videoInfo.embedUrl ? (
                      <iframe
                        src={`${videoInfo.embedUrl}?autoplay=1`}
                        className="w-full max-w-[95%] h-[65vh] md:h-[75vh] rounded-2xl shadow-2xl bg-black border border-white/10"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={`${label} Video - ${currentIndex + 1}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <video
                          key={currentMedia}
                          src={currentMedia}
                          controls
                          autoPlay
                          playsInline
                          className="w-full h-full max-w-[95%] max-h-[75vh] object-contain rounded-2xl shadow-2xl bg-black border border-white/10"
                        />
                      </div>
                    )
                  ) : (
                    <div 
                      className="transition-transform duration-200 ease-out flex items-center justify-center min-w-full min-h-full"
                      style={{ transform: `scale(${zoomScale})` }}
                    >
                      <img
                        src={images[currentIndex]}
                        alt={`${label} - ${currentIndex + 1}`}
                        className="w-full h-full max-w-[95%] max-h-[75vh] object-contain rounded-2xl shadow-xl select-none"
                        style={{ cursor: zoomScale > 1 ? 'zoom-out' : 'zoom-in' }}
                        onClick={() => {
                          if (zoomScale > 1) resetZoom();
                          else setZoomScale(1.5);
                        }}
                      />
                    </div>
                  )}

                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={prev}
                        className="absolute start-3 sm:start-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/85 dark:bg-black/70 hover:bg-white dark:hover:bg-black/90 rounded-full transition-all border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white z-50 shadow-md cursor-pointer"
                        title="Previous item"
                      >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 rtl:rotate-180" />
                      </button>
                      <button 
                        onClick={next}
                        className="absolute end-3 sm:end-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-white/85 dark:bg-black/70 hover:bg-white dark:hover:bg-black/90 rounded-full transition-all border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white z-50 shadow-md cursor-pointer"
                        title="Next item"
                      >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 rtl:rotate-180" />
                      </button>

                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-950/80 backdrop-blur-md py-2 px-4 rounded-full z-50">
                        {images.map((img, i) => {
                          const isV = isVideoMedia(img);
                          return (
                            <button
                              key={i}
                              onClick={() => setCurrentIndex(i)}
                              className={`transition-all flex items-center justify-center ${
                                currentIndex === i 
                                  ? 'w-10 h-2 bg-blue-500 rounded-full' 
                                  : 'w-2 h-2 bg-white/40 rounded-full hover:bg-white/60'
                              }`}
                              title={`Item ${i + 1}${isV ? ' (Video)' : ''}`}
                            >
                              {isV && currentIndex === i && <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
