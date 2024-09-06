import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Button,
  Input,
} from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export const MaxPhotosNotice = ({
  isOpen,
  onClose,
  onSelectImages,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectImages: () => void;
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
            onClose={onClose}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
              <DialogPanel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-lg w-full space-y-4 p-8"
              >
                <DialogTitle className="text-lg font-bold">
                  Get ready!
                </DialogTitle>

                <div className="leading-8">
                  For the best experience, please upload max 10 at a time. Feel
                  free to share as many batches as you like!
                </div>

                <div className="flex gap-4">
                  <Button
                    className="bg-primary/10 rounded-full px-8 h-12 w-full"
                    onClick={onSelectImages}
                  >
                    Select photos
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
