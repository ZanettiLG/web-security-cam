import Container from "../../components/Container";
import CameraViewer from "../../components/CameraViewer";
import { Cameras } from "../../services";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box } from "@mui/material";

const Camera = () => {
  const { id } = useParams();
  const [videoData, setVideoData] = useState<VideoData | null>(null);

  useEffect(() => {
    const fetchCamera = async () => {
      const recordings = await Cameras.getRecordingsByCamera(Number(id));
      setVideoData(recordings[0]);
    };
    fetchCamera();
  }, [id]);

  return (
    <Container title="Camera">
      <Box 
        sx={{ 
          width: "100%", 
          height: "100%",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "black",
          backgroundClip: "border-box",
      }}
      >
        <CameraViewer videoData={videoData} fit="contain" />
      </Box>
    </Container>
  );
};

export default Camera;