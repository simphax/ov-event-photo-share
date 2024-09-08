import { useEffect, useState } from "react";
import { GalleryCountResponseModel } from "@common/types/GalleryCountResponseModel";
import { Dot, RefreshCw } from "lucide-react";

export type UpdatesNotifierProps = {
  galleryCount: number;
  remoteGalleryCount: number;
  isUploading: boolean;
  setRemoteGalleryCount: (count: number) => void;
  onRefresh: () => void;
};

export const UpdatesNotifier = ({
  galleryCount,
  isUploading,
  onRefresh,
  remoteGalleryCount,
  setRemoteGalleryCount,
}: UpdatesNotifierProps) => {
  useEffect(() => {
    console.log("Starting gallery count stream...");
    const eventSource = new EventSource(
      `${process.env.REACT_APP_API_URL}gallery/count-stream`
    );

    eventSource.onopen = () => {
      console.log("SSE connection opened");
    };

    eventSource.addEventListener("countUpdated", (event) => {
      if (event.data) {
        const countData: GalleryCountResponseModel = JSON.parse(event.data);
        setRemoteGalleryCount(countData.count);
      }
    });

    eventSource.onerror = (err) => {
      console.error("SSE error:", err);
    };

    return () => {
      eventSource.close();
      console.log("SSE connection closed");
    };
  }, [setRemoteGalleryCount]);

  if (remoteGalleryCount > galleryCount) {
    return (
      <div
        className="fixed cursor-pointer bottom-6 left-0 flex items-center w-full justify-center appear-delay"
        onClick={onRefresh}
      >
        <div className="rounded-full bg-notification text-primaryText gap-3 flex justify-center items-center text-sm px-4 h-10 shadow-lg">
          <div>{remoteGalleryCount - galleryCount} new</div>
          {/* <div className="border-l border-t-primaryText/60 mx-2 h-4"></div> */}
          <div className="flex items-center gap-1">
            <RefreshCw size={16} />

            <div className="font-semibold">Update</div>
          </div>
        </div>
      </div>
    );
  }

  if (remoteGalleryCount && !isUploading && remoteGalleryCount < galleryCount) {
    return (
      <div
        className="fixed cursor-pointer bottom-6 left-0 flex items-center w-full justify-center appear-delay"
        onClick={onRefresh}
      >
        <div className="rounded-full bg-notification text-primaryText gap-3 flex justify-center items-center text-sm px-4 h-10 shadow-lg">
          <div>New updates</div>
          <div className="flex items-center gap-1">
            <RefreshCw size={16} />

            <div className="font-semibold">Update</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
