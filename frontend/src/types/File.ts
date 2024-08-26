export default interface ImageItemResponseModel {
  id: string,
  thumbnail: {
    url: string,
    width: number,
    height: number
  },
  image: {
    url: string,
    width: number,
    height: number
  },
  user: string,
  name: string,
  uploadedDateTime: Date,
}