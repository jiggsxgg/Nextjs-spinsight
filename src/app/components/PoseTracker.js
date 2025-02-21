"use client";

import { useEffect, useRef, useState } from "react";
import * as mpPose from "@mediapipe/pose";

export default function PoseTracker({ strokeCount, setStrokeCount }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [correct, setCorrect] = useState(false);
  let prevState = false;
  let camera = null;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const pose = new mpPose.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results) => {
        updateStrokeCount(results.poseLandmarks);
        drawPose(results);
      });

      camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });

      camera.start();
    };

    return () => {
      camera?.stop();
    };
  }, []);

  function updateStrokeCount(landmarks) {
    if (!landmarks) return;

    const eyeBox = getBoundingBox([2, 5], landmarks, 15, 15);
    const wristBox = getBoundingBox([15, 16], landmarks, 15, 15);

    const isCorrect = boxesIntersect(eyeBox, wristBox);
    setCorrect(isCorrect);

    if (isCorrect && !prevState) {
      setStrokeCount((prev) => prev + 1);
    }
    prevState = isCorrect;
  }

  function getBoundingBox(points, landmarks, width, height) {
    let xMin = 1,
      xMax = 0,
      yMin = 1,
      yMax = 0;

    points.forEach((index) => {
      const landmark = landmarks[index];
      if (landmark) {
        xMin = Math.min(xMin, landmark.x);
        xMax = Math.max(xMax, landmark.x);
        yMin = Math.min(yMin, landmark.y);
        yMax = Math.max(yMax, landmark.y);
      }
    });

    return {
      x: xMin * canvasRef.current.width - width / 2,
      y: yMin * canvasRef.current.height - height / 2,
      width,
      height,
    };
  }

  function boxesIntersect(box1, box2) {
    return !(
      box1.x > box2.x + box2.width ||
      box1.x + box1.width < box2.x ||
      box1.y > box2.y + box2.height ||
      box1.y + box1.height < box2.y
    );
  }

  function drawPose(results) {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.poseLandmarks) {
      drawSelectedLandmarks(ctx, results.poseLandmarks);
      drawSelectedSkeleton(ctx, results.poseLandmarks);
      drawBoundingBoxes(ctx, results.poseLandmarks);
    }
  }

  function drawSelectedLandmarks(ctx, landmarks) {
    const keypoints = [2, 5, 11, 12, 13, 14, 15, 16];

    keypoints.forEach((index) => {
      const landmark = landmarks[index];
      if (!landmark) return;

      ctx.beginPath();
      ctx.fillStyle = ["red", "yellow", "purple", "green", "blue"][Math.floor(index / 5)];
      ctx.arc(landmark.x * canvasRef.current.width, landmark.y * canvasRef.current.height, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  function drawSelectedSkeleton(ctx, landmarks) {
    const connections = [
      [11, 13], // Left Shoulder → Left Elbow
      [13, 15], // Left Elbow → Left Wrist
      [12, 14], // Right Shoulder → Right Elbow
      [14, 16], // Right Elbow → Right Wrist
    ];

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;

    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(start.x * canvasRef.current.width, start.y * canvasRef.current.height);
        ctx.lineTo(end.x * canvasRef.current.width, end.y * canvasRef.current.height);
        ctx.stroke();
      }
    });
  }

  function drawBoundingBoxes(ctx, landmarks) {
    const eyeBox = getBoundingBox([2, 5], landmarks, 0, 0);
    const wristBox = getBoundingBox([15, 16], landmarks, 0, 0);

    ctx.strokeStyle = correct ? "green" : "red";
    ctx.lineWidth = 3;

    ctx.strokeRect(eyeBox.x, eyeBox.y, eyeBox.width, eyeBox.height);
    ctx.strokeRect(wristBox.x, wristBox.y, wristBox.width, wristBox.height);
  }

  return (
    <div className="relative w-[640px] h-[480px]">
      <video ref={videoRef} className="absolute top-0 left-0 w-full h-full" autoPlay playsInline></video>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>

      <div className="absolute top-2 left-2 p-2 text-white bg-black rounded-md">
        {correct ? "✅ Correct!" : "❌ Incorrect"}
      </div>
      <div className="absolute top-10 left-2 p-2 text-white bg-black rounded-md">
        Correct Stroke: {strokeCount}
      </div>
    </div>
  );
}
