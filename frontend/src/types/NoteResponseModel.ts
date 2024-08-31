export type NoteResponseModel = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdDateTime: string;
};

//Sortering: Först de som har en note, sedan de som inte har en note, sedan sorterat efter senast uppladdat
