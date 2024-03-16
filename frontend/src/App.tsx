import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import ImagesUpload from "./components/ImagesUpload";

const App: React.FC = () => {
  return (
    <div className="container" style={{ width: "600px" }}>

      <ImagesUpload />
    </div>
  );
}

export default App;
