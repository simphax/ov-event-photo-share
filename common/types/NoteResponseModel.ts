export type NoteResponseModel = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdDateTime: string;
};

//Sortering: Först de som har en note, sedan de som inte har en note, sedan sorterat efter senast uppladdat
//Algoritm för bilder: Visa 10 bilder per person, t.ex. 1a 10e, 20e. +90 bilder.
