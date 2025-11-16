import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center } from "@react-three/drei";
import { EffectComposer, Outline } from "@react-three/postprocessing";
import { useNavigate } from "react-router-dom";

import WelcomeModal from "../components/ui/WelcomeModal";

import Bike from "../components/models/Bike";
import PartClickHandler from "../hooks/PartClickHandler";
import InfoModal from "../components/ui/InfoModal";
import WelcomeScreen from "../components/ui/WelcomeScreen";   // ⬅️ ADD THIS
import { useSelection } from "../store/useSelection";



export default function MainScene() {
  const [openModal, setOpenModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", body: "" });

 const [showWelcome, setShowWelcome] = useState(() => {
  return localStorage.getItem("welcomeDone") !== "true";
});


  const hovered = useSelection((s) => s.hovered);
  const selected = useSelection((s) => s.selected);

  const handlePartClick = (mesh) => {
    console.log("Clicked:", mesh.name);

    switch (mesh.name) {
      case "Spiderman":
        setModalContent({
          title: "About",
          body: "Handlebar info…",
        });
        setOpenModal(true);
        break;

      case "Cube015":
        setModalContent({
          title: "Education",
          body: "education details…",
        });
        setOpenModal(true);
        break;

      case "phone001":
        setModalContent({
          title: "Contact",
          body: "Contact details…",
        });
        setOpenModal(true);
        break;

     case "screen001":
  window.location.href = "/computer";   // ⬅️ open in SAME PAGE
  break;



      case "speaker":
        setModalContent({
          title: "Speaker",
          body: "Speaker details…",
        });
        setOpenModal(true);
        break;

      default:
        break;
    }
  };

 const enterApp = () => {
  setShowWelcome(false);
  localStorage.setItem("welcomeDone", "true");
};



  return (
    <>
      {/* Welcome Screen */}
     {showWelcome && <WelcomeModal onEnter={enterApp} />}


      {/* Modal UI */}
      {!showWelcome && (
        <div className="scene-fade-in">
          <InfoModal
            open={openModal}
            onClose={() => setOpenModal(false)}
            title={modalContent.title}
          >
            {modalContent.body}
          </InfoModal>

          {/* Canvas Wrapper */}
          <div className="canvas-wrapper">
            <Canvas
              className="webgl-canvas"
              camera={{ position: [6, 4, 8], fov: 50 }}
              style={{ pointerEvents: "auto" }}
            >
              <PartClickHandler onPartClick={handlePartClick} />

              {/* Lights */}
              <ambientLight intensity={1} />
              <directionalLight intensity={2} position={[5, 10, 5]} />

              {/* Outline Effect */}
              <EffectComposer multisampling={4}>
                <Outline
                  selection={
                    hovered ? [hovered] : selected ? [selected] : []
                  }
                  edgeStrength={5}
                  visibleEdgeColor="gold"
                  width={500}
                  blur
                />
              </EffectComposer>

              {/* 3D Model */}
              <Center>
                <Bike scale={3} />
              </Center>

              <OrbitControls enableDamping />
            </Canvas>
          </div>
        </div>
      )}
    </>
  );
}
