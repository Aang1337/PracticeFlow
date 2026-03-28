'use client';

interface YouTubePlayerWrapperProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
}

export default function YouTubePlayerWrapper({
  containerRef,
  visible,
}: YouTubePlayerWrapperProps) {
  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full ${
        visible ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'
      }`}
      style={{ transition: 'opacity 0.2s ease' }}
    />
  );
}
