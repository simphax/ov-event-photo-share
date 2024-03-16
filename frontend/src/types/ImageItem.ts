export type ImageItem = {
    url: string,
    id: string,
    name: string,
    uploadProgress: number,
    uploadDone: boolean,
    error: any,
    remoteId?: string,
    file?: File
  }