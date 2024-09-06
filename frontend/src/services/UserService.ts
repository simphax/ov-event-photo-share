import { v4 as uuidv4 } from "uuid";

export const getUserId = (): string => {
  if (!localStorage.getItem("userId")) {
    localStorage.setItem("userId", uuidv4());
  }
  return localStorage.getItem("userId")!;
};

export const getUserName = (): string => {
  return localStorage.getItem("userName") || "";
};

export const setUserName = (newName: string) => {
  localStorage.setItem("userName", newName);
};

export const getHasSeenMaxPhotosNotice = (): boolean => {
  return !!localStorage.getItem("hasSeenMaxPhotosNotice");
};

export const setHasSeenMaxPhotosNotice = (value: boolean) => {
  if (!value) localStorage.removeItem("hasSeenMaxPhotosNotice");
  else localStorage.setItem("hasSeenMaxPhotosNotice", "true");
};
