import { lazy, Suspense } from "react";
import { LoadingProvider } from "./context/LoadingProvider";
import MainContainer from "./components/MainContainer";

// Mirrors the reference App.tsx: LoadingProvider gates the whole app, the heavy
// 3D scene is lazy-loaded and passed into MainContainer as a fixed background layer.
const Scene3D = lazy(() => import("./components/Scene3D"));

const App = () => {
  return (
    <LoadingProvider>
      <MainContainer>
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
      </MainContainer>
    </LoadingProvider>
  );
};

export default App;
