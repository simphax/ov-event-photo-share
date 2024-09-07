import { Slide, SlideImage, SlideNote } from "yet-another-react-lightbox";

declare module "yet-another-react-lightbox" {
  export interface SlideNote extends GenericSlide {
    type: "note";
    id: string;
    userId: string;
    note: string;
    fromName: string;
  }
  export interface SlideImageExt extends SlideImage {
    id: string;
    userId: string;
  }

  interface SlideTypes {
    note: SlideNote;
  }

  interface Labels {
    Delete?: string;
  }
}

export function isNoteSlide(slide: Slide): slide is SlideNote {
  return slide.type === "note";
}

export function NoteSlide({ slide }: { slide: SlideNote }) {
  return (
    <div>
      <div className="container pointer-events-none">
        <div className="bg-primary rounded-3xl font-serif text-primaryText px-8 py-12 min-w-64 leading-loose max-h-[70vh] overflow-scroll">
          <pre className="font-serif break-normal whitespace-pre-wrap">
            {slide.note}
          </pre>
          <div className="mt-8">/ {slide.fromName}</div>
        </div>
      </div>
    </div>
  );
}
