import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import UploadService from "../services/FileUploadService";
import { v4 as uuidv4 } from "uuid";
import ImageItemResponseModel from "../types/File";
import { ImageItem } from "../types/ImageItem";
import ImageGallery from "./ImageGallery";
import "./ImagesUpload.css";
import { getUserId } from "../services/UserService";
import { SelectImages } from "./SelectImages";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const ImagesUpload: React.FC = () => {
  const [oneUploadDone, setOneUploadDone] = useState<boolean>(false);

  const [pendingImageItems, setPendingImageItems] = useState<ImageItem[]>([]);
  const [uploadedImageItems, setUploadedImageItems] = useState<ImageItem[]>([]);
  const [downloadedImageItems, setDownloadedImageItems] = useState<ImageItem[]>(
    []
  );
  const [pendingImageAngles, setPendingImageAngles] = useState<number[]>([
    0, 0, 0,
  ]);

  const [uploadInProgress, setUploadInProgress] = useState<boolean>(false);
  const [itemsCountToUpload, setItemsCountToUpload] = useState<number>(0);
  const uploadProgress = useRef<{ [imageItemId: string]: number }>({});
  const abortControllers = useRef<Record<string, AbortController>>({});

  const sortedUploadedImageItems = useMemo(() => {
    return [...uploadedImageItems].sort(
      (a, b) => b.uploadedDateTime.getTime() - a.uploadedDateTime.getTime()
    );
  }, [uploadedImageItems]);

  const sortedDownloadedImageItems = useMemo(() => {
    return [...downloadedImageItems].sort(
      (a, b) => b.uploadedDateTime.getTime() - a.uploadedDateTime.getTime()
    );
  }, [downloadedImageItems]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await UploadService.getFiles();
        const data: ImageItemResponseModel[] = response.data;
        const imageItems = data.map(
          ({ id, thumbnail, image, name, user, uploadedDateTime }) => ({
            id,
            remoteId: id,
            thumbnail,
            image,
            owner: user,
            uploadedDateTime: new Date(uploadedDateTime || 0),
            loadingDelete: false,
            name,
            uploadProgress: 1,
            uploadDone: true,
            error: false,
          })
        );

        const myImages = imageItems.filter(
          (image) => image.owner === getUserId()
        );
        const theirImages = imageItems.filter(
          (image) => image.owner !== getUserId()
        );
        setUploadedImageItems(myImages);
        setDownloadedImageItems(theirImages);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      }
    };

    fetchImages();
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
        owner: getUserId(),
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
      return UploadService.upload(file, abortController.signal, (event) => {
        uploadProgress.current[imageItem.id] = event.loaded / event.total;
      })
        .then((response) => {
          const { id, image, thumbnail, uploadedDateTime } = response.data;
          setPendingImageItems((currentItems) =>
            currentItems.filter((item) => item.id !== imageItem.id)
          );
          //Prefetch the image
          // const img = new Image();
          // img.src = url;
          // img.onload = () => {
          setUploadedImageItems((currentItems) => [
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
          // };
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
      setUploadedImageItems((currentItems) =>
        currentItems.map((item) =>
          item.id === imageItem.id ? { ...item, loadingDelete: true } : item
        )
      );
      if (imageItem.remoteId)
        await UploadService.deleteFile(imageItem.remoteId);

      const filterItems = (array: ImageItem[]) =>
        array.filter((item) => item.id !== imageItem.id);

      setUploadedImageItems(filterItems);
    } catch (error) {
      console.error("Could not delete image", error);
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

  const lightboxImages = useMemo(
    () =>
      sortedUploadedImageItems
        .concat(sortedDownloadedImageItems)
        .map((imageItem) => ({
          id: imageItem.id,
          src: imageItem.image!.url,
          alt: imageItem.name,
          download: {
            url: imageItem.image!.url,
            filename: imageItem.name,
          },
        })),
    [sortedDownloadedImageItems, sortedUploadedImageItems]
  );

  console.log("lightboxImages", lightboxImages);
  return (
    <div className="mb-10">
      <div style={{ height: "170px" }}>
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
        />
      </div>
      <ImageGallery
        onDeleteImage={deleteImage}
        uploadedImageItems={sortedUploadedImageItems}
        downloadedImageItems={sortedDownloadedImageItems}
        onImageClick={(imageItem) => {
          const index = lightboxImages.findIndex(
            (item) => item.id === imageItem.id
          );
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
        animation={{ fade: 400 }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
          buttonZoom: () => null,
        }}
        plugins={[Download, Zoom]}
      />
    </div>
  );
};

export default ImagesUpload;
