import { useState, useEffect, useCallback } from "react";
import UploadService from "../services/FileUploadService";
import { v4 as uuidv4 } from "uuid";
import IFile from "../types/File";
import { ImageItem } from "../types/ImageItem";
import "./ImagesUpload.css";
import { motion, AnimatePresence } from "framer-motion";

const ImagesUpload: React.FC = () => {
  const [pendingImageItems, setPendingImageItems] = useState<ImageItem[]>([]);
  const [uploadedImageItems, setUploadedImageItems] = useState<ImageItem[]>([]);
  const [downloadedImageItems, setDownloadedImageItems] = useState<ImageItem[]>(
    []
  );

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await UploadService.getFiles();
        const data: IFile[] = response.data;
        const imageItems = data.map(({ id, url, name }) => ({
          id,
          remoteId: id,
          url,
          name,
          uploadProgress: 100,
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
    uploadImages();
  };

  const upload = useCallback((imageItem: ImageItem, file: File) => {
    UploadService.upload(file, (event) => {
      setPendingImageItems((currentItems) =>
        currentItems.map((item) =>
          item.id === imageItem.id
            ? {
                ...item,
                uploadProgress: Math.round((100 * event.loaded) / event.total),
              }
            : item
        )
      );
    })
      .then((response) => {
        const { id, url } = response.data;
        setPendingImageItems((currentItems) =>
          currentItems.filter((item) => item.id !== imageItem.id)
        );
        setUploadedImageItems((currentItems) => [
          ...currentItems,
          {
            ...imageItem,
            remoteId: id,
            url,
            uploadDone: true,
            uploadProgress: 100,
          },
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

  const uploadImages = () => {
    pendingImageItems.forEach((imageItem) => {
      if (imageItem.file) {
        upload(imageItem, imageItem.file); // Use the stored File object
      }
    });
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

  return (
    <div>
      <div className="row my-3">
        <div className="col-8">
          <label className="btn btn-default p-0">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={selectImages}
            />
          </label>
        </div>

        <div className="col-4">
          <button
            className="btn btn-success btn-sm"
            disabled={!pendingImageItems.length}
            onClick={uploadImages}
          >
            Try again
          </button>
        </div>
      </div>

      <AnimatePresence>
        <motion.ul layout className="image-gallery">
          {pendingImageItems.map((imageItem, index) => {
            return (
              <motion.li
                layout
                className={`image-gallery__item image-gallery__item--pending${
                  imageItem.uploadDone ? " image-gallery__item--success" : ""
                }${imageItem.error ? " image-gallery__item--error" : ""}`}
                onClick={() => deleteImage(imageItem)}
                key={imageItem.id}
              >
                <div
                  className="progress-bar"
                  role="progressbar"
                  aria-valuenow={imageItem.uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{ width: imageItem.uploadProgress + "%" }}
                >
                  {imageItem.uploadProgress}%
                </div>
                <img src={imageItem.url} alt={imageItem.name} />
              </motion.li>
            );
          })}
          {uploadedImageItems.map((imageItem, index) => {
            return (
              <motion.li
                layout
                className={`image-gallery__item${
                  imageItem.uploadDone ? " image-gallery__item--success" : ""
                }${imageItem.error ? " image-gallery__item--error" : ""}`}
                onClick={() => deleteImage(imageItem)}
                key={imageItem.id}
              >
                <div
                  className="progress-bar progress-bar-info"
                  role="progressbar"
                  aria-valuenow={imageItem.uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  style={{ width: imageItem.uploadProgress + "%" }}
                >
                  {imageItem.uploadProgress}%
                </div>
                <img src={imageItem.url} alt={imageItem.name} />
              </motion.li>
            );
          })}
          {downloadedImageItems.map((imageItem, index) => (
            <motion.li
              layout
              className={`image-gallery__item`}
              onClick={() => deleteImage(imageItem)}
              key={imageItem.id}
            >
              <img src={imageItem.url} alt={imageItem.name} />
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
};

export default ImagesUpload;
