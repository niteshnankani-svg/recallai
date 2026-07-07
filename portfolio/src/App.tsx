import { LoadingProvider } from "./context/LoadingProvider";
import MainContainer from "./components/MainContainer";

// LoadingProvider gates the app; the 3D hero scene is now lazy-loaded inside the
// Hero section (see components/Hero.tsx), so App just mounts the container.
const App = () => {
  return (
    <LoadingProvider>
      <MainContainer />
    </LoadingProvider>
  );
};

export default App;
