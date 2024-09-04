import { Slide, SlideImage, SlideNote } from "yet-another-react-lightbox";

declare module "yet-another-react-lightbox" {
  export interface SlideNote extends GenericSlide {
    type: "note";
    id: string;
    note: string;
    fromName: string;
  }
  export interface SlideImageExt extends SlideImage {
    id: string;
  }

  interface SlideTypes {
    note: SlideNote;
  }
}

export function isNoteSlide(slide: Slide): slide is SlideNote {
  return slide.type === "note";
}

export function NoteSlide({ slide }: { slide: SlideNote }) {
  return (
    <div>
      <div className="container">
        <div className="bg-primary rounded-xl font-serif text-primaryText px-8 py-12 min-w-64 leading-loose max-h-[70vh] overflow-scroll">
          <pre className="font-serif break-normal whitespace-pre-wrap">
            {slide.note}
          </pre>
          <div className="mt-8">/ {slide.fromName}</div>
        </div>
      </div>
    </div>
  );
}
