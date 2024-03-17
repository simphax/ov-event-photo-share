import { useState, useEffect, useCallback, useRef } from "react";
import UploadService from "../services/FileUploadService";
import { v4 as uuidv4 } from "uuid";
import IFile from "../types/File";
import { ImageItem } from "../types/ImageItem";
import ImageGallery from "./ImageGallery";
import "./ImagesUpload.css";

const ImagesUpload: React.FC = () => {
  const [pendingImageItems, setPendingImageItems] = useState<ImageItem[]>([]);
  const [uploadedImageItems, setUploadedImageItems] = useState<ImageItem[]>([]);
  const [downloadedImageItems, setDownloadedImageItems] = useState<ImageItem[]>(
    []
  );

  const [uploadInProgress, setUploadInProgress] = useState<boolean>(false);
  const [itemsCountToUpload, setItemsCountToUpload] = useState<number>(0);
  const uploadProgress = useRef<{ [imageItemId: string]: number }>({});

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await UploadService.getFiles();
        const data: IFile[] = response.data;
        const imageItems = data.map(({ id, url, name, width, height }) => ({
          id,
          remoteId: id,
          url,
          name,
          width,
          height,
          uploadProgress: 1,
          uploadDone: true,
          error: false,
        }));
        setDownloadedImageItems(imageItems);
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

  const uploadImages = async () => {
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
  };

  const deleteImage = async (imageItem: ImageItem) => {
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
  };

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

  return (
    <div>
      <label className="btn btn-default p-0">
        <input type="file" multiple accept="image/*" onChange={selectImages} />
      </label>
      <button
        className="btn btn-success btn-sm"
        disabled={!pendingImageItems.length}
        onClick={uploadImages}
      >
        Upload
      </button>
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
      {pendingImageItems.map((imageItem, index) => (
        <span key={imageItem.id}></span>
      ))}

      <ImageGallery
        onDeleteImage={deleteImage}
        uploadedImageItems={uploadedImageItems}
        downloadedImageItems={downloadedImageItems}
      />
    </div>
  );
};

export default ImagesUpload;
