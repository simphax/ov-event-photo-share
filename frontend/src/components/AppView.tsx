import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BackendService } from "../services/BackendService";
import { v4 as uuidv4 } from "uuid";
import { ImageItem } from "../types/ImageItem";
import ImageGallery from "./ImageGallery";
import { getUserId } from "../services/UserService";
import { SelectImages } from "./SelectImages";
import Lightbox, {
  SlideNote,
  Slide,
  SlideImage,
  SlideImageExt,
} from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import "./AppView.css";
import "./ProgressBar.css";
import { Note } from "../types/Note";
import { NoteDialog } from "./NoteDialog";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

function isNoteSlide(slide: Slide): slide is SlideNote {
  return slide.type === "note";
}

function NoteSlide({ slide }: { slide: SlideNote }) {
  return (
    <div>
      <div className="container">
        <div className="bg-primary rounded-xl font-serif text-primaryText px-8 py-12 min-w-64 leading-loose max-h-[70vh] overflow-scroll">
          <pre className="font-serif break-normal whitespace-pre-wrap">
            {slide.note}
          </pre>
          <div className="mt-8">/{slide.fromName}</div>
        </div>
      </div>
    </div>
  );
}

export const AppView: React.FC = () => {
  const [oneUploadDone, setOneUploadDone] = useState<boolean>(false);

  const [pendingImageItems, setPendingImageItems] = useState<ImageItem[]>([]);

  const [ownedImageItems, setOwnedImageItems] = useState<ImageItem[]>([]);
  const [othersImageItems, setOthersImageItems] = useState<ImageItem[]>([]);
  const [pendingImageAngles, setPendingImageAngles] = useState<number[]>([
    0, 0, 0,
  ]);

  const [uploadInProgress, setUploadInProgress] = useState<boolean>(false);
  const [itemsCountToUpload, setItemsCountToUpload] = useState<number>(0);
  const uploadProgress = useRef<{ [imageItemId: string]: number }>({});
  const abortControllers = useRef<Record<string, AbortController>>({});

  const [ownedNotes, setOwnedNotes] = useState<Note[]>([]);
  const [othersNotes, setOthersNotes] = useState<Note[]>([]);

  let [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  const sortedOwnedImageItems = useMemo(() => {
    return [...ownedImageItems].sort(
      (a, b) => b.uploadedDateTime.getTime() - a.uploadedDateTime.getTime()
    );
  }, [ownedImageItems]);

  const sortedOthersImageItems = useMemo(() => {
    return [...othersImageItems].sort(
      (a, b) => b.uploadedDateTime.getTime() - a.uploadedDateTime.getTime()
    );
  }, [othersImageItems]);

  const sortedOwnedNotes = useMemo(() => {
    return [...ownedNotes].sort(
      (a, b) => b.createdDateTime.getTime() - a.createdDateTime.getTime()
    );
  }, [ownedNotes]);

  const sortedOthersNotes = useMemo(() => {
    return [...othersNotes].sort(
      (a, b) => b.createdDateTime.getTime() - a.createdDateTime.getTime()
    );
  }, [othersNotes]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notesResponse = await BackendService.getNotes();
        const imageItemsResponse = await BackendService.getImageItems();

        const imageItems: ImageItem[] = imageItemsResponse.map(
          ({ id, thumbnail, image, name, user, uploadedDateTime }) => ({
            id,
            remoteId: id,
            thumbnail,
            image,
            userId: user,
            uploadedDateTime: new Date(uploadedDateTime || 0),
            loadingDelete: false,
            name,
            uploadProgress: 1,
            uploadDone: true,
            error: false,
          })
        );

        const myImages = imageItems.filter(
          (image) => image.userId === getUserId()
        );
        const theirImages = imageItems.filter(
          (image) => image.userId !== getUserId()
        );
        setOwnedImageItems(myImages);
        setOthersImageItems(theirImages);

        const notes: Note[] = notesResponse.map(
          ({ id, content, userId, userName, createdDateTime }) => ({
            id,
            content,
            userId,
            userName,
            createdDateTime: new Date(createdDateTime || 0),
            loadingDelete: false,
          })
        );
        const myNotes = notes.filter((note) => note.userId === getUserId());
        const theirNotes = notes.filter((note) => note.userId !== getUserId());
        setOwnedNotes(myNotes);
        setOthersNotes(theirNotes);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      }
    };

    fetchData();
  }, []);

  const updateProgress = () => {
    setPendingImageItems((currentItems) =>
      currentItems.map((item) => ({
        ...item,
        uploadProgress: uploadProgress.current[item.id] || 0,
      }))
    );
  };

  useEffect(() => {
    let interval: NodeJS.Timer;
    if (uploadInProgress) {
      interval = setInterval(() => {
        updateProgress();
      }, 250);
    }

    return () => clearInterval(interval);
  }, [uploadInProgress]);

  const selectImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPendingImageItems = Array.from(files).map((file) => {
      const id = uuidv4();
      return {
        id,
        file,
        thumbnail: {
          url: URL.createObjectURL(file),
        },
        name: file.name,
        uploadedDateTime: new Date(),
        userId: getUserId(),
        uploadProgress: 0,
        uploadDone: false,
        error: false,
        loadingDelete: false,
      };
    });

    setPendingImageItems(newPendingImageItems);
  };

  const upload = useCallback(
    async (imageItem: ImageItem, file: File) => {
      const abortController = new AbortController();
      abortControllers.current[imageItem.id] = abortController;
      return BackendService.uploadImageItem(
        file,
        abortController.signal,
        (event) => {
          uploadProgress.current[imageItem.id] = event.loaded / event.total;
        }
      )
        .then((response) => {
          const { id, image, thumbnail, uploadedDateTime } = response;
          setPendingImageItems((currentItems) =>
            currentItems.filter((item) => item.id !== imageItem.id)
          );

          setOwnedImageItems((currentItems) => [
            {
              ...imageItem,
              image,
              thumbnail,
              uploadedDateTime: new Date(uploadedDateTime),
              remoteId: id,
              uploadDone: true,
              uploadProgress: 100,
              loadingDelete: false,
            },
            ...currentItems,
          ]);

          if (!oneUploadDone) setOneUploadDone(true);
        })
        .catch((error) => {
          console.error("Upload error for file", imageItem.name, error);
          setPendingImageItems((currentItems) =>
            currentItems.map((item) =>
              item.id === imageItem.id
                ? { ...item, error: true, uploadProgress: 0, uploadDone: false }
                : item
            )
          );
        });
    },
    [oneUploadDone]
  );

  const cancelUpload = useCallback(() => {
    for (const [id, controller] of Object.entries(abortControllers.current)) {
      controller.abort();
      delete abortControllers.current[id];
    }
    setPendingImageItems([]);
    setUploadInProgress(false);
  }, []);

  const uploadImages = useCallback(async () => {
    try {
      setItemsCountToUpload(pendingImageItems.length);
      setUploadInProgress(true);
      await Promise.all(
        pendingImageItems.map((imageItem) => upload(imageItem, imageItem.file!))
      );
    } catch (err) {
      console.error(err);
    }
    setUploadInProgress(false);
  }, [pendingImageItems, upload]);

  const deleteImage = useCallback(async (imageItem: ImageItem) => {
    try {
      setOwnedImageItems((currentItems) =>
        currentItems.map((item) =>
          item.id === imageItem.id ? { ...item, loadingDelete: true } : item
        )
      );
      if (imageItem.remoteId)
        await BackendService.deleteImageItem(imageItem.remoteId);

      const filterItems = (array: ImageItem[]) =>
        array.filter((item) => item.id !== imageItem.id);

      setOwnedImageItems(filterItems);
    } catch (error) {
      setOwnedImageItems((currentItems) =>
        currentItems.map((item) =>
          item.id === imageItem.id ? { ...item, loadingDelete: false } : item
        )
      );
      console.error("Could not delete image", error);
    }
  }, []);

  const deleteNote = useCallback(async (note: Note) => {
    try {
      setOwnedNotes((currentNotes) =>
        currentNotes.map((item) =>
          item.id === note.id ? { ...item, loadingDelete: true } : item
        )
      );
      await BackendService.deleteNote(note.id);

      const filterNotes = (array: Note[]) =>
        array.filter((item) => item.id !== note.id);

      setOwnedNotes(filterNotes);
    } catch (error) {
      setOwnedNotes((currentNotes) =>
        currentNotes.map((item) =>
          item.id === note.id ? { ...item, loadingDelete: false } : item
        )
      );
      console.error("Could not delete note", error);
    }
  }, []);

  //Automatic upload
  useEffect(() => {
    if (uploadInProgress) return;
    if (pendingImageItems.length === 0) return;

    const imagesWithError = pendingImageItems.filter((item) => item.error);
    if (imagesWithError.length > 0) return;

    uploadImages();
    setPendingImageAngles([
      Math.floor(Math.random() * 51) - 25,
      Math.floor(Math.random() * 51) - 25,
      Math.floor(Math.random() * 51) - 25,
    ]);
  }, [uploadInProgress, pendingImageItems, uploadImages]);

  let combinedProgress = 100;

  if (pendingImageItems.length) {
    combinedProgress = pendingImageItems.reduce((acc, item) => {
      return acc + item.uploadProgress;
    }, 0);
    combinedProgress =
      (combinedProgress + (itemsCountToUpload - pendingImageItems.length)) /
      itemsCountToUpload;
    combinedProgress = Math.round(100 * combinedProgress);
  }

  //Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentIndex] = useState(0);

  const lightboxImages: (SlideImageExt | SlideNote)[] = useMemo(() => {
    const mapImageItemToSlide = (imageItem: ImageItem): SlideImageExt => ({
      id: imageItem.id,
      src: imageItem.image!.url,
      alt: imageItem.name,
      download: {
        url: imageItem.image!.url,
        filename: imageItem.name,
      },
    });

    const mapNoteToSlide = (note: Note): SlideNote => ({
      type: "note",
      id: note.id,
      note: note.content,
      fromName: note.userName,
    });

    const ownedNoteSlides: SlideNote[] = sortedOwnedNotes.map(mapNoteToSlide);
    const ownedImageSlides: SlideImageExt[] =
      sortedOwnedImageItems.map(mapImageItemToSlide);
    const othersNoteSlides: SlideNote[] = sortedOthersNotes.map(mapNoteToSlide);
    const othersImageSlides: SlideImageExt[] =
      sortedOthersImageItems.map(mapImageItemToSlide);

    return [
      ...ownedNoteSlides,
      ...ownedImageSlides,
      ...othersNoteSlides,
      ...othersImageSlides,
    ];
  }, [
    sortedOthersImageItems,
    sortedOwnedImageItems,
    sortedOthersNotes,
    sortedOwnedNotes,
  ]);

  return (
    <div className="mb-10">
      <div style={{ height: "180px" }}>
        <SelectImages
          pendingImageItems={pendingImageItems}
          setPendingImageItems={setPendingImageItems}
          uploadImages={uploadImages}
          uploadInProgress={uploadInProgress}
          oneUploadDone={oneUploadDone}
          pendingImageAngles={pendingImageAngles}
          combinedProgress={combinedProgress}
          selectImages={selectImages}
          cancelUpload={cancelUpload}
          onAddNoteClick={() => setIsNoteDialogOpen(true)}
        />
      </div>
      <ImageGallery
        onDeleteImage={deleteImage}
        onDeleteNote={deleteNote}
        ownedImageItems={sortedOwnedImageItems}
        othersImageItems={sortedOthersImageItems}
        ownedNotes={sortedOwnedNotes}
        othersNotes={sortedOthersNotes}
        onImageClick={(imageItem) => {
          const index = lightboxImages.findIndex(
            (item) => item.id === imageItem.id
          );
          setCurrentIndex(index);
          setLightboxOpen(true);
        }}
        onNoteClick={(note) => {
          const index = lightboxImages.findIndex((item) => item.id === note.id);
          setCurrentIndex(index);
          setLightboxOpen(true);
        }}
      />
      <Lightbox
        controller={{
          closeOnPullDown: true,
          closeOnPullUp: true,
          closeOnBackdropClick: true,
        }}
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxImages}
        index={currentImageIndex}
        on={{ view: ({ index }) => setCurrentIndex(index) }}
        styles={{
          container: {
            backgroundColor: "rgba(0, 0, 0, .8)",
          },
        }}
        carousel={{
          finite: true,
        }}
        animation={{ fade: 400 }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
          buttonZoom: () => null,
          slide: ({ slide }) =>
            isNoteSlide(slide) ? <NoteSlide slide={slide} /> : null,
        }}
        plugins={[Download, Zoom]}
      />
      <NoteDialog
        isOpen={isNoteDialogOpen}
        onCancel={() => setIsNoteDialogOpen(false)}
        onAddNote={(note) => {
          BackendService.addNote(note)
            .then((note) => {
              const newNote: Note = {
                id: note.id,
                content: note.content,
                userId: note.userId,
                userName: note.userName,
                createdDateTime: new Date(note.createdDateTime || 0),
                loadingDelete: false,
              };
              setOwnedNotes((currentNotes) => [newNote, ...currentNotes]);
            })
            .catch((error) => {
              console.error("Could not add note", error);
            });
          setIsNoteDialogOpen(false);
        }}
      />
    </div>
  );
};
