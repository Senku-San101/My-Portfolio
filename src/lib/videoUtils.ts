/**
 * Video Utilities for Project Media
 * Supports YouTube, Vimeo, and direct video files (MP4, WebM, MOV, OGG, MKV)
 */

export interface VideoInfo {
  type: 'youtube' | 'vimeo' | 'direct' | 'none';
  id?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}

export function isVideoMedia(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase().trim();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.m4v') ||
    clean.endsWith('.mkv') ||
    clean.startsWith('data:video/') ||
    clean.startsWith('blob:') ||
    url.includes('youtube.com/') ||
    url.includes('youtu.be/') ||
    url.includes('vimeo.com/') ||
    clean.includes('projects_video_') ||
    clean.includes('/video/')
  );
}

export function extractVideoInfo(url?: string): VideoInfo {
  if (!url || typeof url !== 'string') return { type: 'none' };
  const trimmed = url.trim();

  // YouTube match: regular watch, short URLs, embeds, and shorts
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    return {
      type: 'youtube',
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    const id = vimeoMatch[1];
    return {
      type: 'vimeo',
      id,
      embedUrl: `https://player.vimeo.com/video/${id}`,
    };
  }

  if (isVideoMedia(trimmed)) {
    return { type: 'direct' };
  }

  return { type: 'none' };
}

/**
 * Captures a video frame as an image Data URL using HTML5 Canvas
 */
export function captureVideoFrame(source: File | string, seekTime = 0.5): Promise<string> {
  return new Promise((resolve) => {
    // If it's a YouTube URL, immediately resolve the thumbnail
    if (typeof source === 'string') {
      const yt = extractVideoInfo(source);
      if (yt.type === 'youtube' && yt.thumbnailUrl) {
        return resolve(yt.thumbnailUrl);
      }
    }

    if (typeof document === 'undefined') {
      return resolve('');
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let objectUrl = '';
    if (typeof source === 'string') {
      video.crossOrigin = 'anonymous';
      video.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      video.src = objectUrl;
    }

    const cleanup = () => {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch (e) {}
      }
      video.remove();
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve('');
    }, 5000);

    video.onloadedmetadata = () => {
      // Seek to target time or middle of video if very short
      const targetTime = Math.min(seekTime, video.duration > 0 ? video.duration / 2 : seekTime);
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          clearTimeout(timer);
          cleanup();
          return resolve(dataUrl);
        }
      } catch (err) {
        console.warn('Canvas video capture failed:', err);
      }
      clearTimeout(timer);
      cleanup();
      resolve('');
    };

    video.onerror = () => {
      clearTimeout(timer);
      cleanup();
      resolve('');
    };
  });
}

/**
 * Computes display media, active picture, and unified media list for a project
 */
export function getProjectDisplayMedia(
  project: {
    id?: string;
    imageUrl?: string;
    images?: string[];
    videoUrl?: string;
    videoThumbnail?: string;
  },
  showVideoThumbnail?: boolean,
  detectedVideoUrl?: string
) {
  const rawVideo = (project.videoUrl || detectedVideoUrl || '').trim();
  const rawThumb = (project.videoThumbnail || '').trim();
  const rawImg = (project.imageUrl || '').trim();
  const rawImages = (project.images || []).map(s => (s || '').trim()).filter(Boolean);

  const hasVideo = Boolean(
    rawVideo ||
    rawImages.some(isVideoMedia)
  );

  // Unified list of all media for the project viewer/gallery
  // CRITICAL: Any video MUST always be placed FIRST at index 0 so that clicking
  // the card thumbnail or "Watch Video" button opens the playable video immediately!
  const mediaList: string[] = [];

  // When rawVideo is present, it is always item #0
  if (rawVideo) {
    mediaList.push(rawVideo);
  }

  // Add any video files in rawImages upfront right after rawVideo
  rawImages.forEach((m) => {
    if (isVideoMedia(m) && !mediaList.includes(m)) {
      mediaList.push(m);
    }
  });

  // Then add the remaining screenshot images
  rawImages.forEach((m) => {
    if (!mediaList.includes(m)) mediaList.push(m);
  });
  if (rawImg && !mediaList.includes(rawImg)) {
    mediaList.push(rawImg);
  }

  // Only if mediaList is completely empty and no video exists, include rawThumb as a fallback image:
  if (mediaList.length === 0 && rawThumb) {
    mediaList.push(rawThumb);
  }

  // Determine the primary cover picture displayed on the project card/listing:
  let pictureUrl = '';
  let isVideo = false;
  let isDirectVideo = false;

  // If a video thumbnail was provided or captured, use it as the preview picture on the card:
  if (rawThumb) {
    pictureUrl = rawThumb;
    isVideo = hasVideo;
    isDirectVideo = false;
  } else if (rawVideo) {
    const yt = extractVideoInfo(rawVideo);
    if (yt.type === 'youtube' && yt.thumbnailUrl) {
      pictureUrl = yt.thumbnailUrl;
      isVideo = true;
    } else {
      pictureUrl = rawVideo;
      isVideo = true;
      isDirectVideo = true;
    }
  } else if (rawImages.length > 0) {
    pictureUrl = rawImages[0];
    isVideo = isVideoMedia(pictureUrl);
    isDirectVideo = isVideo && !extractVideoInfo(pictureUrl).embedUrl;
  } else if (rawImg) {
    pictureUrl = rawImg;
    isVideo = isVideoMedia(pictureUrl);
    isDirectVideo = isVideo && !extractVideoInfo(pictureUrl).embedUrl;
  }

  // Final fallback: if pictureUrl is still empty but mediaList has items
  if (!pictureUrl && mediaList.length > 0) {
    pictureUrl = mediaList[0];
    isVideo = isVideoMedia(pictureUrl);
    isDirectVideo = isVideo && !extractVideoInfo(pictureUrl).embedUrl;
  }

  // If pictureUrl is set but mediaList is somehow empty, ensure pictureUrl is in mediaList
  if (pictureUrl && mediaList.length === 0) {
    mediaList.push(pictureUrl);
  }

  return {
    pictureUrl,
    isVideo,
    isDirectVideo,
    allMedia: mediaList,
    hasVideo,
  };
}
