import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";

export interface HandLandmarks {
  wrist: { x: number; y: number } | null;
  ringFingerBase: { x: number; y: number } | null;
  ringFingerTip: { x: number; y: number } | null;
  indexFingerBase: { x: number; y: number } | null;
  handWidth: number;
  detected: boolean;
  handedness: "Left" | "Right" | null;
}

// Hand landmark indices for MediaPipe Hands model
const HAND_KEYPOINTS = {
  wrist: 0,
  indexFingerMCP: 5, // Base of index finger
  middleFingerMCP: 9,
  ringFingerMCP: 13, // Base of ring finger (for ring placement)
  ringFingerTIP: 16, // Tip of ring finger
  pinkyMCP: 17,
};

export function useHandDetection(videoRef: React.RefObject<HTMLVideoElement>) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<HandLandmarks>({
    wrist: null,
    ringFingerBase: null,
    ringFingerTip: null,
    indexFingerBase: null,
    handWidth: 0,
    detected: false,
    handedness: null,
  });

  const detectorRef = useRef<handPoseDetection.HandDetector | null>(null);
  const animationRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // Initialize hand detection model
  const initializeDetector = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await tf.ready();
      console.log("TensorFlow.js backend for hands:", tf.getBackend());

      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig: handPoseDetection.MediaPipeHandsTfjsModelConfig = {
        runtime: "tfjs",
        modelType: "full",
        maxHands: 2,
      };

      detectorRef.current = await handPoseDetection.createDetector(
        model,
        detectorConfig
      );

      console.log("Hand detector initialized successfully");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to initialize hand detector:", err);
      setError("Failed to load hand detection model");
      setIsLoading(false);
    }
  }, []);

  // Extract keypoint
  const getPoint = (keypoints: handPoseDetection.Keypoint[], index: number) => {
    if (keypoints[index]) {
      return { x: keypoints[index].x, y: keypoints[index].y };
    }
    return null;
  };

  // Calculate hand width from keypoints
  const calculateHandWidth = (keypoints: handPoseDetection.Keypoint[]) => {
    const index = keypoints[HAND_KEYPOINTS.indexFingerMCP];
    const pinky = keypoints[HAND_KEYPOINTS.pinkyMCP];
    if (index && pinky) {
      return Math.abs(index.x - pinky.x);
    }
    return 0;
  };

  // Run hand detection loop
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
        const hands = await detectorRef.current.estimateHands(video, {
          flipHorizontal: false,
        });

        if (hands.length > 0 && hands[0].keypoints) {
          const hand = hands[0];
          const keypoints = hand.keypoints;

          setLandmarks({
            wrist: getPoint(keypoints, HAND_KEYPOINTS.wrist),
            ringFingerBase: getPoint(keypoints, HAND_KEYPOINTS.ringFingerMCP),
            ringFingerTip: getPoint(keypoints, HAND_KEYPOINTS.ringFingerTIP),
            indexFingerBase: getPoint(keypoints, HAND_KEYPOINTS.indexFingerMCP),
            handWidth: calculateHandWidth(keypoints),
            detected: true,
            handedness: hand.handedness as "Left" | "Right",
          });
        } else {
          setLandmarks((prev) => ({ ...prev, detected: false }));
        }
      } catch (err) {
        console.error("Hand detection error:", err);
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

  // Cleanup
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
