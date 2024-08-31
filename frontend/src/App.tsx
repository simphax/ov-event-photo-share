import "./App.css";
import "yet-another-react-lightbox/styles.css";
import { ReactComponent as Sigill } from "./sigill.svg";

import { AppView } from "./components/AppView";

const App: React.FC = () => {
  return (
    <div className="container">
      <div
        className="flex justify-center"
        style={{ margin: "6rem auto 2rem auto" }}
      >
        <Sigill />
      </div>
      <AppView />
    </div>
  );
};

export default App;
