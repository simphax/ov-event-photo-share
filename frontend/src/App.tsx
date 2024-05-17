import "./App.css";
import { ReactComponent as Sigill } from "./sigill.svg";

import ImagesUpload from "./components/ImagesUpload";

const App: React.FC = () => {
  return (
    <div className="container">
      <div className="flex justify-center" style={{ margin: "6rem auto 3rem auto" }}>
        <Sigill />
      </div>
      <ImagesUpload />
    </div>
  );
};

export default App;
