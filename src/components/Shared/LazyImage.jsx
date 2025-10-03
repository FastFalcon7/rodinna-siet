import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyImage - Lazy loading obrázkov s blur placeholder
 * Podporuje IntersectionObserver API
 */
function LazyImage({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3C/svg%3E',
  blurAmount = 20,
  onClick,
  style = {}
}) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    let observer;
    let didCancel = false;

    if (imageRef && imageSrc === placeholder) {
      if (IntersectionObserver) {
        observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (
                !didCancel &&
                (entry.intersectionRatio > 0 || entry.isIntersecting)
              ) {
                setIsInView(true);
                setImageSrc(src);
                observer.unobserve(imageRef);
              }
            });
          },
          {
            threshold: 0.01,
            rootMargin: '200px'
          }
        );
        observer.observe(imageRef);
      } else {
        // Fallback pre staré browsery
        setImageSrc(src);
      }
    }
    return () => {
      didCancel = true;
      if (observer && observer.unobserve) {
        observer.unobserve(imageRef);
      }
    };
  }, [src, imageSrc, imageRef, placeholder]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      <img
        ref={setImageRef}
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onClick={onClick}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isLoaded ? 'blur-0 scale-100' : `blur-${blurAmount} scale-105`
        } ${onClick ? 'cursor-pointer' : ''}`}
        style={{
          filter: isLoaded ? 'blur(0)' : `blur(${blurAmount}px)`,
          transform: isLoaded ? 'scale(1)' : 'scale(1.05)'
        }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}
    </div>
  );
}

/**
 * BlurhashImage - Obrázok s blurhash placeholder (vyžaduje blurhash library)
 * Pre jednoduchosť používame base64 blur placeholder
 */
export function createBlurPlaceholder(width = 400, height = 300, color = '#4F46E5') {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Crect fill='${encodeURIComponent(color)}' filter='url(%23b)' width='${width}' height='${height}'/%3E%3C/svg%3E`;
}

export default LazyImage;
