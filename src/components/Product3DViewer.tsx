import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PresentationControls } from "@react-three/drei";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, ZoomIn, ZoomOut, Move3d } from "lucide-react";
import * as THREE from "three";

interface Product3DViewerProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
  category?: string;
}

// Jewelry model based on category
function JewelryModel({ category, texture }: { category?: string; texture: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  const getGeometry = () => {
    switch (category?.toLowerCase()) {
      case "rings":
        return <torusGeometry args={[0.8, 0.15, 32, 100]} />;
      case "earrings":
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case "necklaces":
        return <torusGeometry args={[1, 0.08, 16, 100]} />;
      case "bangles":
        return <torusGeometry args={[1, 0.12, 32, 100]} />;
      default:
        return <boxGeometry args={[1, 1, 0.2]} />;
    }
  };

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      {getGeometry()}
      <meshStandardMaterial
        color="#D4AF37"
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1.5}
      />
    </mesh>
  );
}

// Spinning platform
function Platform() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <circleGeometry args={[2, 64]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.2} roughness={0.8} />
    </mesh>
  );
}

export function Product3DViewer({ 
  isOpen, 
  onClose, 
  productName, 
  productImage,
  category 
}: Product3DViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom] = useState(5);

  const handleZoomIn = () => setZoom((prev) => Math.max(prev - 1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.min(prev + 1, 10));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
        <DialogHeader className="absolute top-4 left-4 z-10">
          <DialogTitle className="text-lg font-display text-foreground">
            360° View: {productName}
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="absolute top-4 right-16 z-10 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAutoRotate(!autoRotate)}
            className={autoRotate ? "bg-primary/20 border-primary" : ""}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* 3D Canvas */}
        <div className="w-full h-full bg-gradient-to-b from-muted/50 to-background">
          <Canvas
            shadows
            camera={{ position: [0, 0, zoom], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              {/* Lighting */}
              <ambientLight intensity={0.4} />
              <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                intensity={1}
                castShadow
                shadow-mapSize={2048}
              />
              <pointLight position={[-10, -10, -10]} intensity={0.3} />
              <pointLight position={[0, 5, 0]} intensity={0.5} color="#D4AF37" />

              {/* Environment for reflections */}
              <Environment preset="studio" />

              {/* Presentation controls for drag interaction */}
              <PresentationControls
                global
                config={{ mass: 2, tension: 500 }}
                snap={{ mass: 4, tension: 1500 }}
                rotation={[0, 0.3, 0]}
                polar={[-Math.PI / 3, Math.PI / 3]}
                azimuth={[-Math.PI / 1.4, Math.PI / 2]}
              >
                <JewelryModel category={category} texture={productImage} />
              </PresentationControls>

              <Platform />
              <ContactShadows
                position={[0, -0.95, 0]}
                opacity={0.5}
                scale={10}
                blur={2.5}
                far={4}
              />

              {/* Orbit controls */}
              <OrbitControls
                autoRotate={autoRotate}
                autoRotateSpeed={2}
                enablePan={false}
                enableZoom={true}
                minDistance={2}
                maxDistance={10}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 2}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-muted-foreground bg-background/80 px-4 py-2 rounded-full backdrop-blur">
          <Move3d className="h-4 w-4" />
          <span>Drag to rotate • Scroll to zoom</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
