import { useState, useEffect } from "react";
import UploadService from "../services/FileUploadService";
import IFile from "../types/File";
import { ImageItem } from "../types/ImageItem";
import FileUploadService from "../services/FileUploadService";

const ImagesUpload: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [pendingImageItems, setPendingImageItems] = useState<ImageItem[]>([]);
  const [uploadedImageItems, setUploadedImageItems] = useState<ImageItem[]>([]);
  const [downloadedImageItems, setDownloadedImageItems] = useState<ImageItem[]>(
    []
  );

  useEffect(() => {
    UploadService.getFiles().then((response) => {
      let data: IFile[] = response.data;
      let imageItems = data.map(({ id, url, name }) => ({
        id,
        url,
        name,
        uploadProgress: 1,
        uploadDone: true,
        error: false,
      }));
      setDownloadedImageItems(imageItems);
    });
  }, []);

  const selectImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    let imageItems: ImageItem[] = [];
    let files = event.target.files;

    if (files) {
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        imageItems.push({
          id: `new-file-${i}`,
          url: URL.createObjectURL(file),
          name: file.name,
          uploadProgress: 0,
          uploadDone: false,
          error: false,
        });
      }

      setSelectedFiles(files);
      setPendingImageItems(imageItems);
    }
  };

  const upload = (index: number, file: File) => {
    const pendingItemId = pendingImageItems[index].id;
    return UploadService.upload(file, (event) => {
      setPendingImageItems((_pendingImageItems) => {
        _pendingImageItems = [..._pendingImageItems];
        _pendingImageItems[index] = {
          ..._pendingImageItems[index],
          uploadProgress: Math.round((100 * event.loaded) / event.total),
        };
        return _pendingImageItems;
      });
    })
      .then((response) => {
        let { id, url } = response.data;
        setPendingImageItems((_pendingImageItems) => {
          return _pendingImageItems.filter((item) => item.id !== pendingItemId);
        });
        setUploadedImageItems((_uploadedImageItems) => {
          _uploadedImageItems = [..._uploadedImageItems];
          _uploadedImageItems.push({
            id,
            url,
            name: "",
            uploadDone: true,
            uploadProgress: 100,
            error: false,
          });
          return _uploadedImageItems;
        });
      })
      .catch((error: any) => {
        setPendingImageItems((_pendingImageItems) => {
          _pendingImageItems = [..._pendingImageItems];
          _pendingImageItems[index] = {
            ..._pendingImageItems[index],
            uploadProgress: 0,
            uploadDone: false,
            error: error,
          };
          return _pendingImageItems;
        });
      });
  };

  const uploadImages = () => {
    if (selectedFiles != null) {
      const files = Array.from(selectedFiles);

      files.forEach((file, index) => {
        upload(index, file);
      });
    }
  };

  const deleteImage = (id: string) => async () => {
    try {
      await FileUploadService.deleteFile(id);
      const removeItemWithId = (array: ImageItem[]) =>
        array.filter((item) => item.id !== id);

      setPendingImageItems(removeItemWithId);
      setUploadedImageItems(removeItemWithId);
      setDownloadedImageItems(removeItemWithId);
    } catch (err) {
      console.error("Could not delete image", err);
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
            disabled={!selectedFiles}
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
                <button onClick={deleteImage(imageItem.id)}>Delete</button>
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
