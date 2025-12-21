import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PresentationControls, useGLTF, Center } from "@react-three/drei";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, ZoomIn, ZoomOut, Move3d, Upload, Box } from "lucide-react";
import * as THREE from "three";

interface Product3DViewerProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
  category?: string;
  modelUrl?: string; // URL to a .glb/.gltf file
}

// Component to load and display custom 3D model
function CustomModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  useEffect(() => {
    // Center and scale the model appropriately
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim; // Normalize to fit in view
      scene.scale.setScalar(scale);
      
      // Center the model
      const center = box.getCenter(new THREE.Vector3());
      scene.position.sub(center.multiplyScalar(scale));
    }
  }, [scene]);

  return (
    <group ref={meshRef}>
      <primitive object={scene.clone()} />
    </group>
  );
}

// Default jewelry model based on category
function JewelryModel({ category }: { category?: string }) {
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

// Loading indicator for 3D content
function LoadingIndicator() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshBasicMaterial color="#D4AF37" wireframe />
    </mesh>
  );
}

export function Product3DViewer({ 
  isOpen, 
  onClose, 
  productName, 
  productImage,
  category,
  modelUrl: initialModelUrl
}: Product3DViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom] = useState(5);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(initialModelUrl || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.max(prev - 1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.min(prev + 1, 10));

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    // Validate file type
    const validExtensions = ['.glb', '.gltf'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      setUploadError("Please upload a .glb or .gltf file");
      setIsUploading(false);
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("File size must be less than 50MB");
      setIsUploading(false);
      return;
    }

    try {
      // Create a local URL for the uploaded file
      const url = URL.createObjectURL(file);
      setCustomModelUrl(url);
    } catch (err) {
      console.error("Error loading model:", err);
      setUploadError("Failed to load the 3D model. Please try a different file.");
    } finally {
      setIsUploading(false);
    }
  };

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (customModelUrl && customModelUrl.startsWith('blob:')) {
        URL.revokeObjectURL(customModelUrl);
      }
    };
  }, [customModelUrl]);

  const handleRemoveModel = () => {
    if (customModelUrl && customModelUrl.startsWith('blob:')) {
      URL.revokeObjectURL(customModelUrl);
    }
    setCustomModelUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

        {/* Upload 3D Model Panel */}
        <div className="absolute top-16 left-4 z-10 bg-background/90 p-3 rounded-lg backdrop-blur border border-border max-w-xs">
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Box className="h-4 w-4" />
            Custom 3D Model
          </Label>
          
          <div className="flex gap-2 mt-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf"
              onChange={handleFileUpload}
              className="text-xs"
              disabled={isUploading}
            />
          </div>

          {customModelUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveModel}
              className="mt-2 text-xs w-full"
            >
              Remove Custom Model
            </Button>
          )}

          {uploadError && (
            <p className="text-xs text-destructive mt-2">{uploadError}</p>
          )}

          {isUploading && (
            <p className="text-xs text-muted-foreground mt-2">Loading model...</p>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            Upload .glb or .gltf files (max 50MB)
          </p>
        </div>

        {/* Model type indicator */}
        <div className="absolute top-16 right-4 z-10">
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            customModelUrl 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-primary/20 text-primary border border-primary/30"
          }`}>
            {customModelUrl ? "Custom Model" : "Default Preview"}
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="w-full h-full bg-gradient-to-b from-muted/50 to-background">
          <Canvas
            shadows
            camera={{ position: [0, 0, zoom], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={<LoadingIndicator />}>
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
                <Center>
                  {customModelUrl ? (
                    <Suspense fallback={<LoadingIndicator />}>
                      <CustomModel url={customModelUrl} />
                    </Suspense>
                  ) : (
                    <JewelryModel category={category} />
                  )}
                </Center>
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
