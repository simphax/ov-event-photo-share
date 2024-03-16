import axios from "axios";

export default axios.create({
  baseURL: "http://simonclara.wedding/share-moments",
  headers: {
    "Content-type": "application/json",
  },
});
