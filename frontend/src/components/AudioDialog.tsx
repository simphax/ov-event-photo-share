import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { AudioRecorder } from "./AudioRecorder";
import { X } from "lucide-react";

interface AudioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (audioBlob: Blob) => void;
}

export const AudioDialog: React.FC<AudioDialogProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
                
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-primaryText text-center mb-4"
                >
                  Voice Recording
                </Dialog.Title>
                
                <div className="mt-2">
                  <AudioRecorder onSave={onSave} onCancel={onClose} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};