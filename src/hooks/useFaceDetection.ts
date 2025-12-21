import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

export interface FaceLandmarks {
  leftEar: { x: number; y: number } | null;
  rightEar: { x: number; y: number } | null;
  chin: { x: number; y: number } | null;
  nose: { x: number; y: number } | null;
  leftEye: { x: number; y: number } | null;
  rightEye: { x: number; y: number } | null;
  neckBase: { x: number; y: number } | null;
  faceWidth: number;
  faceHeight: number;
  detected: boolean;
}

const FACE_MESH_KEYPOINTS = {
  // Left ear region (tragion)
  leftEar: 234,
  // Right ear region (tragion)
  rightEar: 454,
  // Chin tip
  chin: 152,
  // Nose tip
  nose: 1,
  // Left eye center
  leftEye: 159,
  // Right eye center
  rightEye: 386,
  // Points for neck estimation (bottom of face)
  jawLeft: 172,
  jawRight: 397,
};

export function useFaceDetection(videoRef: React.RefObject<HTMLVideoElement>) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<FaceLandmarks>({
    leftEar: null,
    rightEar: null,
    chin: null,
    nose: null,
    leftEye: null,
    rightEye: null,
    neckBase: null,
    faceWidth: 0,
    faceHeight: 0,
    detected: false,
  });
  
  const detectorRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const animationRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // Initialize TensorFlow and face detection model
  const initializeDetector = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure TensorFlow backend is ready
      await tf.ready();
      console.log("TensorFlow.js backend:", tf.getBackend());

      // Create face landmarks detector using MediaPipe FaceMesh
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
        runtime: "tfjs",
        refineLandmarks: true,
        maxFaces: 1,
      };

      detectorRef.current = await faceLandmarksDetection.createDetector(
        model,
        detectorConfig
      );

      console.log("Face detector initialized successfully");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to initialize face detector:", err);
      setError("Failed to load face detection model");
      setIsLoading(false);
    }
  }, []);

  // Extract landmark point
  const getPoint = (keypoints: faceLandmarksDetection.Keypoint[], index: number) => {
    if (keypoints[index]) {
      return { x: keypoints[index].x, y: keypoints[index].y };
    }
    return null;
  };

  // Run face detection loop
  const startDetection = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || isRunningRef.current) return;

    isRunningRef.current = true;

    const detect = async () => {
      if (!isRunningRef.current || !detectorRef.current || !videoRef.current) return;

      const video = videoRef.current;
      
      if (video.readyState < 2) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const faces = await detectorRef.current.estimateFaces(video, {
          flipHorizontal: false,
        });

        if (faces.length > 0 && faces[0].keypoints) {
          const keypoints = faces[0].keypoints;
          
          // Get face bounding box
          const box = faces[0].box;
          const faceWidth = box?.width || 0;
          const faceHeight = box?.height || 0;

          // Calculate neck base position (below chin)
          const chin = getPoint(keypoints, FACE_MESH_KEYPOINTS.chin);
          const neckBase = chin ? { x: chin.x, y: chin.y + faceHeight * 0.3 } : null;

          setLandmarks({
            leftEar: getPoint(keypoints, FACE_MESH_KEYPOINTS.leftEar),
            rightEar: getPoint(keypoints, FACE_MESH_KEYPOINTS.rightEar),
            chin,
            nose: getPoint(keypoints, FACE_MESH_KEYPOINTS.nose),
            leftEye: getPoint(keypoints, FACE_MESH_KEYPOINTS.leftEye),
            rightEye: getPoint(keypoints, FACE_MESH_KEYPOINTS.rightEye),
            neckBase,
            faceWidth,
            faceHeight,
            detected: true,
          });
        } else {
          setLandmarks((prev) => ({ ...prev, detected: false }));
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [videoRef]);

  // Stop detection
  const stopDetection = useCallback(() => {
    isRunningRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
    };
  }, [stopDetection]);

  return {
    landmarks,
    isLoading,
    error,
    initializeDetector,
    startDetection,
    stopDetection,
  };
}
