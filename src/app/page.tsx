"use client"; // Ensure this is a client component

import PoseTracker from "./components/PoseTracker";
import { useState } from "react";

export default function Home() {
  const [strokeCount, setStrokeCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold">Table Tennis Stroke Tracker</h1>

      {/* Pass strokeCount and setStrokeCount to PoseTracker */}
      <PoseTracker strokeCount={strokeCount} setStrokeCount={setStrokeCount} />

      {/* Reset Button */}
      <button
        onClick={() => setStrokeCount(0)}
        className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-700 text-white font-bold rounded"
      >
        Reset Counter
      </button>
    </div>
  );
}