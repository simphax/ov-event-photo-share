import "./App.css";
import "yet-another-react-lightbox/styles.css";

import { AppView } from "./components/AppView";

const App: React.FC = () => {
  return (
    <>
      <div className="background"></div>
      <div className="gradient">
        <div className="container">
          <AppView />
        </div>
      </div>
    </>
  );
};

export default App;
