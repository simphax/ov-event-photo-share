import { AudioPlayer } from "./AudioPlayer";
import { Slide } from "yet-another-react-lightbox";

// Create our own SlideAudio type with all required properties
export interface SlideAudio {
  type: "audio";
  id: string;
  userId: string;
  userName?: string;
  audio: {
    url: string;
    duration?: number;
  };
  
  // Include standard Slide properties to ensure compatibility with Lightbox
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export const isAudioSlide = (slide: any): slide is SlideAudio => {
  return slide && slide.type === "audio";
};

interface AudioSlideProps {
  slide: SlideAudio;
}

export const AudioSlide: React.FC<AudioSlideProps> = ({ slide }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-white">
      <div className="max-w-xl w-full bg-white text-black p-6 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-1">Voice Recording</h3>
          {slide.userName && (
            <p className="text-gray-600">Shared by {slide.userName}</p>
          )}
        </div>
        
        <AudioPlayer 
          audioUrl={slide.audio.url} 
          duration={slide.audio.duration}
        />
      </div>
    </div>
  );
};