import { useState, useEffect, useCallback } from "react";
import UploadService from "../services/FileUploadService";
import { v4 as uuidv4 } from "uuid";
import IFile from "../types/File";
import { ImageItem } from "../types/ImageItem";

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

  const deleteImage = async (remoteId: string) => {
    try {
      await UploadService.deleteFile(remoteId);
      const filterItems = (array: ImageItem[]) =>
        array.filter((item) => item.remoteId !== remoteId);

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
            Upload
          </button>
        </div>
      </div>

      <div className="card mt-3">
        <ul className="list-group list-group-flush">
          {pendingImageItems.map((imageItem, index) => {
            return (
              <li className="list-group-item" key={index}>
                <p>To upload</p>
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
                <p>Success: {`${imageItem.uploadDone}`}</p>
                <p>Error: {`${imageItem.error}`}</p>
                <img
                  className="preview"
                  src={imageItem.url}
                  alt={"image-" + index}
                />
              </li>
            );
          })}
          {uploadedImageItems.map((imageItem, index) => {
            return (
              <li className="list-group-item" key={index}>
                <p>Uploaded</p>
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
                <p>Success: {`${imageItem.uploadDone}`}</p>
                <p>Error: {`${imageItem.error}`}</p>
                {imageItem.remoteId && (
                  <button onClick={() => deleteImage(imageItem.remoteId!)}>
                    Delete
                  </button>
                )}
                <img
                  className="preview"
                  src={imageItem.url}
                  alt={"image-" + index}
                />
              </li>
            );
          })}
          {downloadedImageItems.map((imageItem, index) => (
            <li className="list-group-item" key={index}>
              <p>
                <a href={imageItem.url}>{imageItem.name}</a>
              </p>
              <img src={imageItem.url} alt={imageItem.name} height="80px" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ImagesUpload;
