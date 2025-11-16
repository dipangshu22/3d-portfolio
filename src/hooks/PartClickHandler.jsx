// src/hooks/PartClickHandler.jsx
import { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useSelection } from "../store/useSelection";

export default function PartClickHandler({ onPartClick }) {
  const { camera, gl, scene } = useThree();
  const setHovered = useSelection((s) => s.setHovered);
  const setSelected = useSelection((s) => s.setSelected);

  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function handleMove(e) {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      if (hits.length > 0) setHovered(hits[0].object);
      else setHovered(null);
    }

    function handleClick(e) {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      if (hits.length > 0) {
        const mesh = hits[0].object;
        setSelected(mesh);
        if (onPartClick) onPartClick(mesh);
      }
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("click", handleClick);
    };
  }, [camera, gl, scene, onPartClick, setHovered, setSelected]);

  return null;
}
