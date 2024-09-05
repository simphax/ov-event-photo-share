import "./App.css";
import "yet-another-react-lightbox/styles.css";

import { AppView } from "./components/AppView";

const App: React.FC = () => {
  return (
    <div className="container">
      <AppView />
      {/* <div className="text-xs text-primary text-center py-8">
        App made by Simon @{" "}
        <a
          href="https://onovo.se"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Onovo Consulting
        </a>
      </div> */}
    </div>
  );
};

export default App;
