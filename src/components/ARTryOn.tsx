import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, FlipHorizontal, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ARTryOnProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productImage: string;
  category?: string;
}

type JewelryType = "earrings" | "necklaces" | "rings" | "bangles";

export function ARTryOn({
  isOpen,
  onClose,
  productName,
  productImage,
  category
}: ARTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const jewelryImageRef = useRef<HTMLImageElement | null>(null);

  const jewelryType = (category?.toLowerCase() || "earrings") as JewelryType;

  // Load jewelry image
  useEffect(() => {
    if (productImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        jewelryImageRef.current = img;
      };
      img.src = productImage;
    }
  }, [productImage]);

  // Start camera
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        streamRef.current = stream;
        setCameraActive(true);
        startOverlay();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied. Please allow camera access to try on jewelry.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setCameraActive(false);
  }, []);

  // Draw jewelry overlay (simplified - uses center face detection simulation)
  const startOverlay = useCallback(() => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay) return;

    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;

      ctx.clearRect(0, 0, overlay.width, overlay.height);

      const jewelry = jewelryImageRef.current;
      if (!jewelry) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Simulated face/hand positions (center of video)
      const centerX = overlay.width / 2;
      const centerY = overlay.height / 2;

      const jewelrySize = Math.min(overlay.width, overlay.height) * 0.2;

      ctx.save();
      ctx.globalAlpha = 0.9;

      switch (jewelryType) {
        case "earrings":
          // Draw earrings on both sides
          const earOffset = overlay.width * 0.18;
          const earY = centerY - overlay.height * 0.05;
          
          // Left earring
          ctx.drawImage(
            jewelry,
            centerX - earOffset - jewelrySize / 2,
            earY,
            jewelrySize,
            jewelrySize * 1.2
          );
          // Right earring
          ctx.drawImage(
            jewelry,
            centerX + earOffset - jewelrySize / 2,
            earY,
            jewelrySize,
            jewelrySize * 1.2
          );
          break;

        case "necklaces":
          // Draw necklace around neck area
          const necklaceWidth = overlay.width * 0.4;
          const necklaceHeight = necklaceWidth * 0.3;
          ctx.drawImage(
            jewelry,
            centerX - necklaceWidth / 2,
            centerY + overlay.height * 0.1,
            necklaceWidth,
            necklaceHeight
          );
          break;

        case "rings":
          // Draw ring on estimated finger position
          const ringSize = jewelrySize * 0.6;
          ctx.drawImage(
            jewelry,
            centerX - ringSize / 2,
            centerY + overlay.height * 0.2,
            ringSize,
            ringSize
          );
          break;

        case "bangles":
          // Draw bangle on wrist area
          const bangleSize = jewelrySize * 1.2;
          ctx.drawImage(
            jewelry,
            centerX - bangleSize / 2,
            centerY + overlay.height * 0.15,
            bangleSize,
            bangleSize * 0.4
          );
          break;
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  }, [jewelryType]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    const canvas = canvasRef.current;
    if (!video || !overlay || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Draw overlay
    ctx.drawImage(overlay, 0, 0);

    // Download image
    const link = document.createElement("a");
    link.download = `tryon-${productName.replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    toast({
      title: "Photo saved!",
      description: "Your virtual try-on photo has been downloaded.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
        <DialogHeader className="absolute top-4 left-4 z-20 bg-background/80 px-3 py-2 rounded-lg backdrop-blur">
          <DialogTitle className="text-lg font-display text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Try On: {productName}
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
        <div className="absolute top-4 right-16 z-20 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMirrored(!isMirrored)}
            className={isMirrored ? "bg-primary/20 border-primary" : ""}
          >
            <FlipHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={cameraActive ? stopCamera : startCamera}
          >
            {cameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          </Button>
        </div>

        {/* Camera View */}
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Starting camera...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <div className="flex flex-col items-center gap-4 text-center px-8">
                <Camera className="h-12 w-12 text-destructive" />
                <p className="text-destructive">{error}</p>
                <Button onClick={startCamera} variant="gold">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
            playsInline
            muted
          />

          <canvas
            ref={overlayRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
          />

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Product preview */}
          <div className="absolute bottom-20 left-4 bg-background/80 p-2 rounded-lg backdrop-blur z-10">
            <img
              src={productImage}
              alt={productName}
              className="w-16 h-16 object-cover rounded"
            />
          </div>
        </div>

        {/* Capture Button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <Button
            onClick={handleCapture}
            variant="gold"
            size="lg"
            className="rounded-full px-8"
            disabled={!cameraActive}
          >
            <Camera className="h-5 w-5 mr-2" />
            Capture Photo
          </Button>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 px-3 py-2 rounded-lg backdrop-blur">
          Position yourself in the center for best results
        </div>
      </DialogContent>
    </Dialog>
  );
}
