import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Check, Trash2 } from 'lucide-react';
import { Button } from '@headlessui/react';

type AudioRecorderProps = {
  onSave: (audioBlob: Blob) => void;
  onCancel: () => void;
};

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSave, onCancel }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      // Reset state
      audioChunksRef.current = [];
      setElapsedTime(0);
      setAudioURL(null);
      
      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up data collection
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Set up recording completion handler
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setDuration(elapsedTime);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSave = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onSave(audioBlob);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center p-4 gap-4 text-primaryText">
      <div className="w-full flex justify-center items-center mb-2">
        <span className="text-lg font-semibold text-primaryText">
          {recording ? 'Recording...' : audioURL ? 'Preview' : 'Record Audio'}
        </span>
      </div>
      
      {/* Timer/Duration Display */}
      <div className="text-2xl font-mono mb-2 text-primaryText">
        {recording ? formatTime(elapsedTime) : audioURL ? formatTime(duration) : '0:00'}
      </div>
      
      {/* Audio Player (when recording is complete) */}
      {audioURL && (
        <audio 
          ref={audioRef}
          src={audioURL} 
          controls 
          className="w-full my-4" 
        />
      )}
      
      {/* Recording Controls */}
      <div className="flex w-full justify-center gap-4 mt-2">
        {!recording && !audioURL && (
          <Button
            onClick={startRecording}
            className="bg-primary hover:bg-primary/90 text-primaryText p-4 rounded-full border border-primaryText"
          >
            <Mic size={24} />
          </Button>
        )}
        
        {recording && (
          <Button
            onClick={stopRecording}
            className="bg-primary hover:bg-primary/90 text-primaryText p-4 rounded-full border border-primaryText"
          >
            <Square size={24} />
          </Button>
        )}
        
        {audioURL && (
          <>
            <Button
              onClick={onCancel}
              className="bg-primary hover:bg-primary/90 text-primaryText p-4 rounded-full border border-primaryText"
            >
              <Trash2 size={24} />
            </Button>
            
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primaryText p-4 rounded-full border border-primaryText"
            >
              <Check size={24} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};