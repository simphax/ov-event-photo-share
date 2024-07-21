import { useState, useEffect, useCallback, useRef } from "react";
import UploadService from "../services/FileUploadService";
import { v4 as uuidv4 } from "uuid";
import IFile from "../types/File";
import { ImageItem } from "../types/ImageItem";
import ImageGallery from "./ImageGallery";
import "./ImagesUpload.css";
import { getUserId } from "../services/UserService";

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const ImagesUpload: React.FC = () => {
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

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await UploadService.getFiles();
        const data: IFile[] = response.data;
        const imageItems = data.map(({ id, url, name, user, width, height }) => ({
          id,
          remoteId: id,
          url,
          owner: user,
          name,
          width,
          height,
          uploadProgress: 1,
          uploadDone: true,
          error: false,
        }));

        const myImages = imageItems.filter(image => image.owner === getUserId());
        const theirImages = imageItems.filter(image => image.owner !== getUserId());
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
        url: URL.createObjectURL(file),
        name: file.name,
        owner: getUserId(),
        uploadProgress: 0,
        uploadDone: false,
        error: false,
      };
    });

    setPendingImageItems(newPendingImageItems);
  };

  const upload = useCallback(async (imageItem: ImageItem, file: File) => {
    return UploadService.upload(file, (event) => {
      uploadProgress.current[imageItem.id] = event.loaded / event.total;
    })
      .then((response) => {
        const { id, url, width, height } = response.data;
        setPendingImageItems((currentItems) =>
          currentItems.filter((item) => item.id !== imageItem.id)
        );
        //Prefetch the image
        const img = new Image();
        img.src = url;
        img.onload = () => {
          setUploadedImageItems((currentItems) => [
            {
              ...imageItem,
              remoteId: id,
              width,
              height,
              url,
              uploadDone: true,
              uploadProgress: 100,
            },
            ...currentItems,
          ]);
        };
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
      if (imageItem.remoteId)
        await UploadService.deleteFile(imageItem.remoteId);

      const filterItems = (array: ImageItem[]) =>
        array.filter((item) => item.id !== imageItem.id);

      setPendingImageItems(filterItems);
      setUploadedImageItems(filterItems);
      setDownloadedImageItems(filterItems);
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
      Math.floor(Math.random() * 61) - 30,
      Math.floor(Math.random() * 61) - 30,
      Math.floor(Math.random() * 61) - 30,
    ]);
  }, [uploadInProgress, pendingImageItems, uploadImages]);

  // useEffect(() => {
  //   setPendingImageAngles([
  //     Math.floor(Math.random() * 61) - 30,
  //     Math.floor(Math.random() * 61) - 30,
  //     Math.floor(Math.random() * 61) - 30,
  //   ]);
  // }, [pendingImageItems.length]);

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

  let photoArea = (
    <label className="bg-primary p-4 rounded-full text-primaryText relative overflow-hidden block text-center tracking-wider font-semibold">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={selectImages}
        className="cursor-pointer absolute inset-0 w-full h-full opacity-0"
      />
      Choose photos to share
    </label>
  );

  const pendingtemsWithError = pendingImageItems.filter((item) => item.error);

  if (uploadInProgress) {
    photoArea = (
      <div className="progress-container">
        <div className="progress-images">
          {pendingImageItems.slice(0, 3).map((imageItem, index) => (
            <div
              className="progress-images__image"
              key={imageItem.id}
              style={
                {
                  backgroundImage: `url(${imageItem.url})`,
                  "--angle": `${pendingImageAngles[index]}deg`,
                } as React.CSSProperties
              }
            />
          ))}
          <div className="progress-images__count">
            <span className="text-sm tracking-wider font-semibold">
              {pendingImageItems.length}
            </span>
          </div>
        </div>

        <div className="progress-progress">
          <div className="progress-progress__text text-sm tracking-wider font-semibold mb-2">
            Uploading...
          </div>
          <div className="progress">
            <div
              className="progress__bar"
              role="progressbar"
              aria-valuenow={combinedProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ width: combinedProgress + "%" }}
            ></div>
          </div>
        </div>
        <div className="progress-cancel">
          <button
            className="progress-cancel__button"
            onClick={() => setPendingImageItems([])}
          >
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </button>
        </div>
      </div>
    );
  } else if (pendingtemsWithError.length > 0) {
    photoArea = (
      <div className="progress-container">
        <div className="progress-images">
          {pendingImageItems.slice(0, 3).map((imageItem, index) => (
            <div
              className="progress-images__image"
              key={imageItem.id}
              style={
                {
                  backgroundImage: `url(${imageItem.url})`,
                  "--angle": `${pendingImageAngles[index]}deg`,
                } as React.CSSProperties
              }
            />
          ))}
          <div className="progress-images__count">
            <span className="text-sm tracking-wider font-semibold">
              {pendingImageItems.length}
            </span>
          </div>
        </div>

        <div className="progress-progress">
          <div className="progress-progress__text text-sm tracking-wider font-semibold mb-2">
            Could not upload all pictures
          </div>
          <button
            className="progress-progress__button"
            onClick={() => uploadImages()}
          >
            Try again
          </button>
        </div>
        <div className="progress-cancel">
          <button
            className="progress-cancel__button"
            onClick={() => setPendingImageItems([])}
          >
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* <div className="progress-container">
        <div className="progress-images">
          {downloadedImageItems.slice(0, 3).map((imageItem, index) => (
            <div
              className="progress-images__image"
              key={imageItem.id}
              style={
                {
                  backgroundImage: `url(${imageItem.url})`,
                  "--angle": `${pendingImageAngles[index]}deg`,
                } as React.CSSProperties
              }
            />
          ))}
          <div className="progress-images__count">
            {downloadedImageItems.length > 3 && (
              <span className="text-sm tracking-wider font-semibold">
                {downloadedImageItems.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="progress-progress">
          <div className="progress-progress__text text-sm tracking-wider font-semibold mb-2">
            Uploading...
          </div>
          <div className="progress">
            <div
              className="progress__bar"
              role="progressbar"
              aria-valuenow={combinedProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ width: 40 + "%" }}
            ></div>
          </div>
        </div>
        <div className="progress-cancel">
          <button
            className="progress-cancel__button"
            onClick={() => setPendingImageItems([])}
          >
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </button>
        </div>
      </div> */}
      <div style={{ height: "100px" }}>{photoArea}</div>
      <ImageGallery
        onDeleteImage={deleteImage}
        uploadedImageItems={uploadedImageItems}
        downloadedImageItems={downloadedImageItems}
      />
    </div>
  );
};

export default ImagesUpload;
