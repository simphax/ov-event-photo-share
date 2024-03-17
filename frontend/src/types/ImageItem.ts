export type ImageItem = {
    url: string,
    id: string,
    name: string,
    uploadProgress: number,
    uploadDone: boolean,
    error: any,
    width?: number,
    height?: number,
    remoteId?: string,
    file?: File
  }