import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Button,
  Input,
} from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export const NameDialog = ({
  isOpen,
  onSetName,
}: {
  isOpen: boolean;
  onSetName: (name: string) => void;
}) => {
  const [name, setName] = useState("");

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <Dialog
            static
            open={isOpen}
            className="relative z-50"
            onClose={() => {}}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <div className="fixed inset-0 flex w-screen flex-col items-center justify-center p-4  text-textOnLightbox">
              <div className="flex items-center justify-center gap-2 mb-10 -mt-10">
                <LoadingSpinner /> Uploading
              </div>
              <DialogPanel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-lg w-full space-y-4 p-8"
              >
                <DialogTitle className="text-lg font-bold">
                  What is your name?
                </DialogTitle>
                <Input
                  value={name}
                  className="border p-4 font-serif border-primary/50 rounded-xl data-[focus]:border-transparent bg-none w-full bg-transparent"
                  onChange={(e) => setName(e.target.value)}
                />
                <div className="flex justify-end gap-4">
                  <Button
                    className="bg-primary/10 rounded-full px-8 h-12 w-full"
                    onClick={() => onSetName(name)}
                  >
                    Continue
                  </Button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
};
