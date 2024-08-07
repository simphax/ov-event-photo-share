export type ImageItem = {
    url: string,
    id: string,
    owner: string,
    name: string,
    uploadedDateTime: Date,
    uploadProgress: number,
    uploadDone: boolean,
    loadingDelete: boolean,
    error: any,
    width?: number,
    height?: number,
    remoteId?: string,
    file?: File
  }