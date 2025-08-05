import { useEffect, useRef } from "react";

const CameraViewer = ({ videoData, fit = "cover" }: { videoData: VideoData, fit?: "cover" | "contain" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log("videoData", videoData);
    if (!!videoData?.video_url && videoRef.current) {
      videoRef.current.src = videoData.video_url;
    }
  }, [videoData]);

  return (
    <video
      playsInline
      muted
      autoPlay
      ref={videoRef}
      style={{
        width: "100%",
        height: fit === "cover" ? "100%" : "auto",
        objectFit: fit,
        backgroundColor: "black",
        backgroundClip: "border-box",
      }}
    />
  );
};

export default CameraViewer;