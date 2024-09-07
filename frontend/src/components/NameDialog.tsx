import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Button,
  Input,
  Field,
  Label,
} from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export const NameDialog = ({
  isOpen,
  onClose,
  onSetName,
}: {
  isOpen: boolean;
  onClose: () => void;
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
            onClose={onClose}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-md"
            />
            <div className="fixed inset-0 flex w-screen flex-col items-center justify-center p-4  text-textOnLightbox">
              <DialogPanel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-lg w-full h-full space-y-4 p-8 flex flex-col justify-around"
              >
                <div>
                  <DialogTitle className="text-3xl font-semibold">
                    Get ready!
                  </DialogTitle>
                  <div className="leading-8 text-lg mt-12">
                    For the best experience, please upload max 10 at a time.
                    Feel free to share as many batches as you like!
                  </div>
                </div>
                <div className="flex flex-col">
                  <Field className="mb-4">
                    <Label className="font-semibold block mb-1">
                      Your name
                    </Label>
                    <Input
                      value={name}
                      className="border p-4 font-serif border-primary/50 rounded-xl data-[focus]:border-transparent bg-none w-full bg-transparent"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field>
                  <button
                    className="bg-primary/10 rounded-full px-8 h-14 w-full mb-2"
                    onClick={() => onSetName(name)}
                  >
                    Select photos
                  </button>
                  <Button className="px-8 h-14 w-full" onClick={onClose}>
                    Cancel
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
