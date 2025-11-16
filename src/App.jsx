import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/ui/Navbar";
import MainScene from "./scenes/MainScene";
import Computer from "./pages/Computer";

export default function App() {
  const location = useLocation();

  const hideNavbar = location.pathname === "/computer";

  return (
    <>
      {!hideNavbar && <Navbar />}  {/* ⬅️ Navbar hidden only on /computer */}

      <Routes>
        <Route path="/" element={<MainScene />} />
        <Route path="/computer" element={<Computer />} />
      </Routes>
    </>
  );
}
