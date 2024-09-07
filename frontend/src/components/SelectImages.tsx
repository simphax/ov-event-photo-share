import { Button } from "@headlessui/react";
import { ImageItem } from "../types/ImageItem";
import { Check, NotebookPen, PlusIcon } from "lucide-react";
import { MaxPhotosNotice } from "./MaxPhotosNotice";
import { useRef, useState } from "react";
import {
  getHasSeenMaxPhotosNotice,
  getUserName,
  setHasSeenMaxPhotosNotice,
} from "../services/UserService";
import { NameDialog } from "./NameDialog";

export function SelectImages({
  pendingImageItems,
  setPendingImageItems,
  uploadImages,
  uploadInProgress,
  successType,
  pendingImageAngles,
  combinedProgress,
  selectImages,
  cancelUpload,
  onAddNoteClick,
  onSetName,
}: {
  pendingImageItems: ImageItem[];
  setPendingImageItems: any; // Replace 'any' with the actual type of setPendingImageItems
  uploadImages: any; // Replace 'any' with the actual type of uploadImages
  uploadInProgress: boolean;
  successType: undefined | "photo" | "note";
  pendingImageAngles: any; // Replace 'any' with the actual type of pendingImageAngles
  combinedProgress: any; // Replace 'any' with the actual type of combinedProgress
  selectImages: any; // Replace 'any' with the actual type of selectImages
  cancelUpload: any; // Replace 'any' with the actual type of cancelUpload
  onAddNoteClick: () => void;
  onSetName: (name: string) => Promise<void>;
}): JSX.Element {
  const pendingtemsWithError = pendingImageItems.filter((item) => item.error);

  const inputRef = useRef<HTMLInputElement>(null);

  let [isNameDialogOpen, setIsNameDialogOpen] = useState(false);

  const handleFileInputOnChange = (...args: any[]) => {
    setIsNameDialogOpen(false);
    selectImages(...args);
  };

  if (uploadInProgress) {
    return (
      <div className="progress-container">
        <div className="progress-images">
          {pendingImageItems.slice(0, 3).map((imageItem, index) => (
            <div
              className="progress-images__image"
              key={imageItem.id}
              style={
                {
                  backgroundImage: `url(${imageItem.thumbnail.url})`,
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
          <button className="progress-cancel__button" onClick={cancelUpload}>
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

  if (pendingtemsWithError.length > 0) {
    return (
      <div className="progress-container">
        <div className="progress-images">
          {pendingImageItems.slice(0, 3).map((imageItem, index) => (
            <div
              className="progress-images__image"
              key={imageItem.id}
              style={
                {
                  backgroundImage: `url(${imageItem.thumbnail.url})`,
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
            Could not upload all
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

  if (successType === "photo") {
    return (
      <>
        <div className="flex align-center justify-center text-primaryText">
          <Check size={28} />
        </div>
        <p className="text-center text-lg font-serif mt-2 mb-5 text-primaryText">
          Awesome!
        </p>

        <div className="py-6 flex gap-4">
          <label className="bg-primary shadow-md w-full flex items-center justify-center rounded-full text-primaryText/90 relative overflow-hidden text-center font-semibold">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={selectImages}
              className="cursor-pointer absolute inset-0 w-full h-full opacity-0"
            />
            Upload more
          </label>

          <Button
            className="text-primaryText/90 shadow-md w-full py-3 font-semibold px-6 flex gap-2 items-center justify-center bg-primary/35 rounded-full"
            onClick={onAddNoteClick}
          >
            <NotebookPen size={20} />
            Add a note
          </Button>
        </div>
      </>
    );
  }

  if (successType === "note") {
    return (
      <>
        <div className="flex align-center justify-center text-primaryText">
          <Check size={28} />
        </div>
        <p className="text-center text-lg font-serif mt-2 mb-5 text-primaryText">
          Thanks!
        </p>

        <div className="py-6 flex gap-4">
          <label className="bg-primary shadow-md w-full flex items-center justify-center rounded-full text-primaryText/90 relative overflow-hidden text-center font-semibold">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={selectImages}
              className="cursor-pointer absolute inset-0 w-full h-full opacity-0"
            />
            Share photos
          </label>

          <Button
            className="text-primaryText/90 shadow-md w-full py-3 font-semibold px-6 flex gap-2 items-center justify-center bg-primary/10 rounded-full"
            onClick={onAddNoteClick}
          >
            <NotebookPen size={20} />
            Add a note
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="text-center flex flex-col justify-center items-center">
      <label
        onClick={(e) => {
          if (!getUserName()) {
            e.preventDefault();
            e.stopPropagation();
            setIsNameDialogOpen(true);
          }
        }}
        className="bg-primary h-14 items-center shadow-md justify-center w-52 rounded-full text-primaryText/90 relative overflow-hidden flex text-center font-semibold gap-3"
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputOnChange}
          className="cursor-pointer absolute inset-0 w-full h-full opacity-0"
          ref={inputRef}
        />
        <PlusIcon size={22} />
        Share photos
      </label>

      <Button
        className="text-primaryText/90 shadow-md h-14  w-52 font-semibold px-10 mx-auto flex gap-3 items-center justify-center bg-primary/35 rounded-full mt-6"
        onClick={onAddNoteClick}
      >
        <NotebookPen size={22} />
        Add a note
      </Button>

      <NameDialog
        isOpen={isNameDialogOpen}
        onClose={() => {
          setIsNameDialogOpen(false);
        }}
        onSetName={(name: string) => {
          onSetName(name);
          inputRef.current?.click();
        }}
      />
    </div>
  );
}
