import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@headlessui/react';

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioLength, setAudioLength] = useState(duration || 0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setAudioLength(audio.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  return (
    <div className="flex flex-col w-full gap-2 p-4 rounded-lg bg-gray-100">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-3">
        <Button 
          onClick={togglePlayPause}
          className="bg-primary rounded-full p-2 flex-shrink-0"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </Button>
        
        <div className="flex-grow flex flex-col gap-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(audioLength)}</span>
          </div>
          
          <input
            type="range"
            min="0"
            max={audioLength || 100}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full"
          />
        </div>
        
        <Volume2 size={18} className="text-gray-600" />
      </div>
    </div>
  );
};