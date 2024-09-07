import {
  Textarea,
  Dialog,
  DialogPanel,
  DialogTitle,
  Button,
  Field,
  Label,
  Input,
} from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useEffect, useState } from "react";

export const NoteDialog = memo(
  ({
    isOpen,
    userName,
    onCancel,
    onAddNote,
  }: {
    isOpen: boolean;
    userName: string;
    onCancel: () => void;
    onAddNote: (note: string, name: string) => void;
  }) => {
    const [note, setNote] = useState("");
    const [name, setName] = useState("");

    useEffect(() => {
      if (userName) setName(userName);
    }, [userName]);

    useEffect(() => {
      if (!isOpen) setNote("");
    }, [isOpen]);

    return (
      <>
        <AnimatePresence>
          {isOpen && (
            <Dialog
              static
              open={isOpen}
              onClose={() => onCancel()}
              className="relative z-50"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-md"
              />
              <div className="fixed inset-0 flex w-screen items-center justify-center p-4 text-textOnLightbox">
                <DialogPanel
                  as={motion.div}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-lg w-full space-y-4 p-8"
                >
                  <DialogTitle className="text-lg font-bold">
                    Your note
                  </DialogTitle>
                  <Textarea
                    autoFocus
                    value={note}
                    className="border p-4 h-40 font-serif border-primary/50 rounded-xl data-[focus]:border-transparent bg-none w-full bg-transparent"
                    onChange={(e) => setNote(e.target.value)}
                  ></Textarea>

                  <Field>
                    <Label className="font-semibold block mb-1">
                      Your name
                    </Label>
                    <Input
                      value={name}
                      className="border p-4 font-serif border-primary/50 rounded-xl data-[focus]:border-transparent bg-none w-full bg-transparent"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Field>
                  <div className="flex justify-end gap-4">
                    <Button className="px-8 h-12" onClick={() => onCancel()}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-primary/10 rounded-full px-12 h-12"
                      onClick={() => onAddNote(note, name)}
                    >
                      Send
                    </Button>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>
          )}
        </AnimatePresence>
      </>
    );
  }
);
