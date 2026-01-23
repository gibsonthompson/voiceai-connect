'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface CallPlaybackProps {
  recordingUrl: string;
  callDuration?: number; // Duration in seconds from database
  brandColor?: string; // Agency primary color for theming
}

export default function CallPlayback({ recordingUrl, callDuration, brandColor = '#10b981' }: CallPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(callDuration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Format time as M:SS
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Playback failed:', err);
        setError('Unable to play recording');
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Handle timeline scrubbing
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Change playback speed
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      // Use audio duration if available, fallback to prop
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else if (callDuration) {
        setDuration(callDuration);
      }
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    const handleError = () => {
      setIsLoading(false);
      setError('Unable to load recording');
      console.error('Error loading audio file');
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [callDuration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(5);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, duration]);

  // Calculate progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!recordingUrl) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-[#f5f5f0]/50">No recording available for this call</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <audio ref={audioRef} src={recordingUrl} preload="metadata" />
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: brandColor }}
          />
          <p className="text-[#f5f5f0]/50 text-sm ml-3">Loading recording...</p>
        </div>
      )}

      {/* Player Controls */}
      {!isLoading && (
        <>
          {/* Timeline */}
          <div className="space-y-2">
            <div 
              onClick={handleTimelineClick}
              className="h-2 rounded-full bg-white/10 cursor-pointer relative overflow-hidden group"
            >
              {/* Progress fill */}
              <div 
                className="h-full rounded-full transition-all duration-100"
                style={{ 
                  width: `${progressPercent}%`,
                  backgroundColor: brandColor 
                }}
              />
              {/* Hover indicator */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {/* Time Display */}
            <div className="flex items-center justify-between text-xs text-[#f5f5f0]/40">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {/* Skip Backward */}
            <button
              onClick={() => skip(-5)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Skip backward 5 seconds (←)"
            >
              <SkipBack className="w-5 h-5 text-[#f5f5f0]/70" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f0] text-[#0a0a0a] hover:bg-white transition-colors"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(5)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Skip forward 5 seconds (→)"
            >
              <SkipForward className="w-5 h-5 text-[#f5f5f0]/70" />
            </button>
          </div>

          {/* Playback Speed */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-[#f5f5f0]/40">Speed:</span>
            <div className="flex gap-1">
              {[0.5, 1, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    playbackRate === rate
                      ? 'text-white'
                      : 'bg-white/10 text-[#f5f5f0]/70 hover:bg-white/20'
                  }`}
                  style={playbackRate === rate ? { backgroundColor: brandColor } : undefined}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts Info */}
          <p className="text-xs text-[#f5f5f0]/30 text-center pt-2">
            <span className="font-medium">Space</span> play/pause · 
            <span className="font-medium"> ←</span> back 5s · 
            <span className="font-medium"> →</span> forward 5s
          </p>
        </>
      )}
    </div>
  );
}