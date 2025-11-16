import { useGLTF } from "@react-three/drei";

export default function Bike(props) {
  const { scene } = useGLTF("/models/portfolioenv.glb");

  scene.position.set(0,0, 0);   // center
  scene.rotation.set(0, 0, 0);   // no rotation

  return <primitive object={scene} {...props} />;
}

