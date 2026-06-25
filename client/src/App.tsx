import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { AdminPage } from "./pages/AdminPage";
import { ViewerPage } from "./pages/ViewerPage";
import { SocketProvider } from "./lib/socket";

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/broadcast" element={<AdminPage />} />
          <Route path="/watch" element={<ViewerPage />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
