import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BackendService } from "../services/BackendService";
import { v4 as uuidv4 } from "uuid";
import { ImageItem } from "../types/ImageItem";
import ImageGallery from "./ImageGallery";
import { getUserId, getUserName, setUserName } from "../services/UserService";
import { SelectImages } from "./SelectImages";
import Lightbox, {
  SlideNote,
  SlideImageExt,
  IconButton,
  useLightboxState,
  Slide,
} from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import toast, { Toaster } from "react-hot-toast";

import { ReactComponent as Sigill } from "../sigill.svg";

import "./AppView.css";
import "./ProgressBar.css";
import { Note } from "../types/Note";
import { NoteDialog } from "./NoteDialog";
import { NameDialog } from "./NameDialog";
import { UserItem } from "../types/UserItem";
import { isNoteSlide, NoteSlide } from "./NoteSlide";

import { Turtle } from "./Turtle";
import { UpdatesNotifier } from "./UpdatesNotifier";
import { maxItemsBeforeShowMore } from "./constants";
import { Loader, Trash2Icon } from "lucide-react";

const pickRelevantImages = (imageItems: ImageItem[]) => {
  if (!imageItems) return [];
  const arrayLength = imageItems.length;
  if (arrayLength === 0) return imageItems;
  if (arrayLength <= maxItemsBeforeShowMore) return imageItems;

  return imageItems.slice(0, maxItemsBeforeShowMore - 1);

  // const result: ImageItem[] = [];

  // const last = imageItems[imageItems.length - 1];

  // for (let i = 0; i < maxItemsBeforeShowMore - 1; i++) {
  //   const index = Math.floor((i * arrayLength) / (maxItemsBeforeShowMore - 1));
  //   result.push(imageItems[index]);
  // }
  // return result.concat(last);
};

const DeleteButton = ({
  onClick,
}: {
  onClick: (currentSlide: Slide | undefined) => Promise<void>;
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const { currentSlide } = useLightboxState();
  if (!currentSlide) return null;

  let canDelete = (currentSlide as SlideImageExt).userId === getUserId();

  if (!canDelete) return null;

  return (
    <IconButton
      className="fixed top-3 left-2"
      label="Delete"
      icon={Trash2Icon}
      renderIcon={() =>
        isDeleting ? (
          <Loader className="animate-spin" />
        ) : (
          <Trash2Icon size={28} />
        )
      }
      onClick={async () => {
        setIsDeleting(true);
        try {
          await onClick(currentSlide);
        } catch {}
        setIsDeleting(false);
      }}
    />
  );
};

export const AppView: React.FC = () => {
  const [successType, setSuccessType] = useState<undefined | "photo" | "note">(
    undefined
  );

  const [remoteGalleryCount, setRemoteGalleryCount] = useState<number>(0);

  const [pendingImageItems, setPendingImageItems] = useState<ImageItem[]>([]);

  const [allImageItems, setAllImageItems] = useState<ImageItem[]>([]);
  const [pendingImageAngles, setPendingImageAngles] = useState<number[]>([
    0, 0, 0,
  ]);

  const [uploadInProgress, setUploadInProgress] = useState<boolean>(false);
  const [itemsCountToUpload, setItemsCountToUpload] = useState<number>(0);
  const uploadProgress = useRef<{ [imageItemId: string]: number }>({});
  const abortControllers = useRef<Record<string, AbortController>>({});

  const [allNotes, setAllNotes] = useState<Note[]>([]);

  const [userNames, setUserNames] = useState<{ [id: string]: string }>({});

  let [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  const sortedItems: (Note | ImageItem)[] = useMemo(() => {
    return [...allNotes, ...allImageItems].sort((a, b) => {
      const bDate =
        (b as Note).createdDateTime || (b as ImageItem).uploadedDateTime;
      const aDate =
        (a as Note).createdDateTime || (a as ImageItem).uploadedDateTime;

      return bDate.getTime() - aDate.getTime();
    });
  }, [allImageItems, allNotes]);

  const sortedImageItems = useMemo(() => {
    return [...allImageItems].sort(
      (a, b) => b.uploadedDateTime.getTime() - a.uploadedDateTime.getTime()
    );
  }, [allImageItems]);

  const sortedNotes = useMemo(() => {
    return [...allNotes].sort(
      (a, b) => b.createdDateTime.getTime() - a.createdDateTime.getTime()
    );
  }, [allNotes]);

  const userName = getUserName();

  const refetchData = useCallback(async () => {
    try {
      const [notesResponse, imageItemsResponse, usersResponse] =
        await Promise.all([
          BackendService.getNotes(),
          BackendService.getImageItems(),
          BackendService.getUsers(),
        ]);

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

      setAllImageItems(imageItems);

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

      setAllNotes(notes);

      setUserNames(
        usersResponse.reduce((acc, user) => {
          acc[user.id] = user.name;
          return acc;
        }, {} as { [id: string]: string })
      );
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    window.scrollTo({
      top: window.innerHeight * 0.7,
      behavior: "smooth",
    });
    refetchData();
  }, [refetchData]);

  useEffect(() => {
    refetchData();
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

  const upload = useCallback(async (imageItem: ImageItem, file: File) => {
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

        setAllImageItems((currentItems) => [
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

        setRemoteGalleryCount(remoteGalleryCount + 1);

        setSuccessType("photo");
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
  }, []);

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

  const deleteImage = useCallback(
    async (imageItemId: string) => {
      const imageItem = allImageItems.find((item) => item.id === imageItemId);
      if (!imageItem) return;
      try {
        setAllImageItems((currentItems) =>
          currentItems.map((item) =>
            item.id === imageItem.id ? { ...item, loadingDelete: true } : item
          )
        );
        if (imageItem.remoteId)
          await BackendService.deleteImageItem(imageItem.remoteId);

        const filterItems = (array: ImageItem[]) =>
          array.filter((item) => item.id !== imageItem.id);

        setAllImageItems(filterItems);
        setRemoteGalleryCount(remoteGalleryCount - 1);
        toast.success("Image deleted");
      } catch (error) {
        setAllImageItems((currentItems) =>
          currentItems.map((item) =>
            item.id === imageItem.id ? { ...item, loadingDelete: false } : item
          )
        );
        console.error("Could not delete image", error);
      }
    },
    [allImageItems, remoteGalleryCount]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      const note = allNotes.find((item) => item.id === noteId);
      if (!note) return;
      try {
        setAllNotes((currentNotes) =>
          currentNotes.map((item) =>
            item.id === note.id ? { ...item, loadingDelete: true } : item
          )
        );
        await BackendService.deleteNote(note.id);

        const filterNotes = (array: Note[]) =>
          array.filter((item) => item.id !== note.id);

        setAllNotes(filterNotes);
        setRemoteGalleryCount(remoteGalleryCount - 1);
        toast.success("Note deleted");
      } catch (error) {
        setAllNotes((currentNotes) =>
          currentNotes.map((item) =>
            item.id === note.id ? { ...item, loadingDelete: false } : item
          )
        );
        console.error("Could not delete note", error);
      }
    },
    [allNotes, remoteGalleryCount]
  );

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

  const [usersShowAllImages, setUsersShowAllImages] = useState<Set<string>>(
    new Set()
  );

  const showAllImagesForUser = (userId: string) => {
    const newSet = new Set(usersShowAllImages);
    newSet.add(userId);
    setUsersShowAllImages(newSet);
  };

  const showLessImagesForUser = (userId: string) => {
    const newSet = new Set(usersShowAllImages);
    newSet.delete(userId);
    setUsersShowAllImages(newSet);
  };

  const groupedItems: UserItem[] = useMemo(() => {
    const groupedItemses: { [key: string]: (Note | ImageItem)[] } =
      sortedItems.reduce((acc, note) => {
        if (!acc[note.userId]) {
          acc[note.userId] = [];
        }
        acc[note.userId].push(note);
        return acc;
      }, {} as { [key: string]: (Note | ImageItem)[] });

    const groupedNotes: { [key: string]: Note[] } = sortedNotes.reduce(
      (acc, note) => {
        if (!acc[note.userId]) {
          acc[note.userId] = [];
        }
        acc[note.userId].push(note);
        return acc;
      },
      {} as { [key: string]: Note[] }
    );

    const groupedImageItems: { [key: string]: ImageItem[] } =
      sortedImageItems.reduce((acc, imageItem) => {
        if (!acc[imageItem.userId]) {
          acc[imageItem.userId] = [];
        }
        acc[imageItem.userId].push(imageItem);
        return acc;
      }, {} as { [key: string]: ImageItem[] });

    const userIdsWithContent = new Set(Object.keys(groupedItemses));

    const userIdsWithContentArray = Array.from(userIdsWithContent);

    const indexOfSimonClara = userIdsWithContentArray.indexOf("simonclara");
    if (indexOfSimonClara !== -1) {
      userIdsWithContentArray.splice(indexOfSimonClara, 1);
      userIdsWithContentArray.push("simonclara");
    }

    const result = userIdsWithContentArray.map((userId) => {
      const displayedImageItems =
        (usersShowAllImages.has(userId)
          ? groupedImageItems[userId]
          : pickRelevantImages(groupedImageItems[userId])) || [];

      const userItem: UserItem = {
        userId,
        userName: userNames[userId] || "Anonymous",
        notes: groupedNotes[userId] || [],
        imageItems: displayedImageItems,
        isShowingAllItems:
          (groupedImageItems[userId] || []).length ===
          displayedImageItems.length,
        hiddenItemsCount:
          (groupedImageItems[userId] || []).length - displayedImageItems.length,
        hiddenItemsPreview:
          groupedImageItems[userId]?.[maxItemsBeforeShowMore - 1],
      };
      return userItem;
    });

    return result;
  }, [
    sortedItems,
    sortedNotes,
    sortedImageItems,
    usersShowAllImages,
    userNames,
  ]);

  const lightboxSlides: (SlideImageExt | SlideNote)[] = useMemo(() => {
    const mapImageItemToSlide = (imageItem: ImageItem): SlideImageExt => ({
      id: imageItem.id,
      userId: imageItem.userId,
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
      userId: note.userId,
      note: note.content,
      fromName: note.userName,
    });

    return groupedItems.flatMap((group) => {
      const notes = group.notes.map(mapNoteToSlide);
      const imageItems = group.imageItems.map(mapImageItemToSlide);
      return [...notes, ...imageItems];
    });
  }, [groupedItems]);

  const galleryCount = useMemo(
    () => allNotes.length + allImageItems.length,
    [allNotes, allImageItems]
  );

  const deleteImageFromLightbox = async (currentSlide: Slide | undefined) => {
    if (!currentSlide) return;

    console.log("Deleting slide", currentSlide);

    if (isNoteSlide(currentSlide)) {
      await deleteNote(currentSlide.id);
    } else {
      const slide = currentSlide as SlideImageExt;
      await deleteImage(slide.id);
    }
  };

  const handleAddNote = useCallback(
    (note: string, name: string) => {
      BackendService.addNote(note, name)
        .then((note) => {
          const newNote: Note = {
            id: note.id,
            content: note.content,
            userId: note.userId,
            userName: note.userName,
            createdDateTime: new Date(note.createdDateTime || 0),
            loadingDelete: false,
          };
          setUserName(note.userName);
          setUserNames((currentNames) => ({
            ...currentNames,
            [note.userId]: note.userName,
          }));
          setAllNotes((currentNotes) => [newNote, ...currentNotes]);
          setSuccessType("note");
          setRemoteGalleryCount(remoteGalleryCount + 1);
        })
        .catch((error) => {
          console.error("Could not add note", error);
        });
      setIsNoteDialogOpen(false);
    },
    [remoteGalleryCount]
  );

  const handleImageClick = useCallback(
    (imageItem: ImageItem) => {
      const index = lightboxSlides.findIndex(
        (item) => item.id === imageItem.id
      );
      setCurrentIndex(index);
      setLightboxOpen(true);
    },
    [lightboxSlides]
  );

  const handleNoteClick = useCallback(
    (note: Note) => {
      const index = lightboxSlides.findIndex((item) => item.id === note.id);
      setCurrentIndex(index);
      setLightboxOpen(true);
    },
    [lightboxSlides]
  );

  const handleNoteDialogCancel = useCallback(
    () => setIsNoteDialogOpen(false),
    []
  );

  const handleSetName = useCallback(async (name: string) => {
    try {
      setUserName(name);
      await BackendService.setUserName(getUserId(), name);
      setUserNames((currentNames) => ({
        ...currentNames,
        [getUserId()]: getUserName(),
      }));
    } catch (error) {
      console.error("Could not set name", error);
      setUserName("");
    }
  }, []);

  const handleAddNoteClick = useCallback(() => setIsNoteDialogOpen(true), []);

  return (
    <div className="pb-10">
      <div className="flex flex-col h-[75vh] justify-between">
        <div className="h-0"></div>
        <div className="flex justify-center mx-auto">
          <Sigill />
        </div>
        <div className="flex justify-center flex-col px-4">
          <SelectImages
            pendingImageItems={pendingImageItems}
            setPendingImageItems={setPendingImageItems}
            uploadImages={uploadImages}
            uploadInProgress={uploadInProgress}
            successType={successType}
            pendingImageAngles={pendingImageAngles}
            combinedProgress={combinedProgress}
            selectImages={selectImages}
            cancelUpload={cancelUpload}
            onAddNoteClick={handleAddNoteClick}
            onSetName={handleSetName}
          />
          {uploadInProgress && <Turtle />}
        </div>
        <h1 className="px-4 py-3 text-primaryText font-semibold text text-md">
          Guest photos
        </h1>
      </div>
      <ImageGallery
        groupedItems={groupedItems}
        onShowAll={showAllImagesForUser}
        onShowLess={showLessImagesForUser}
        onImageClick={handleImageClick}
        onNoteClick={handleNoteClick}
      />
      <Lightbox
        controller={{
          closeOnPullDown: true,
          closeOnPullUp: true,
          closeOnBackdropClick: true,
        }}
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
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
        toolbar={{
          buttons: [
            <DeleteButton key="my-button" onClick={deleteImageFromLightbox} />,
            "download",
            "close",
          ],
        }}
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
        onCancel={handleNoteDialogCancel}
        userName={userName}
        onAddNote={handleAddNote}
      />
      <UpdatesNotifier
        remoteGalleryCount={remoteGalleryCount}
        setRemoteGalleryCount={setRemoteGalleryCount}
        galleryCount={galleryCount}
        onRefresh={handleRefresh}
      />
      <Toaster containerStyle={{ zIndex: 10000 }} position="bottom-center" />
    </div>
  );
};
