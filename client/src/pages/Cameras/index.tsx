import { 
  useEffect,
  useState,
  useMemo
} from "react";
import { SxProps } from "@mui/material";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Container from "../../components/Container";
import CameraViewer from "../../components/CameraViewer";
import { Cameras as CamerasService } from "../../services";

const CameraContainer = ({ children, onClick, sx }: { children: React.ReactNode, onClick: () => void, sx?: SxProps }) => {
  return (
    <Box
      sx={{
        ...sx,
        p: 2,
        width: "300px",
        height: "300px",
        display: "flex",
        alignItems: "center",
        borderRadius: "10px",
        flexDirection: "column",
        border: "1px solid #000",
        justifyContent: "center",
        cursor: "pointer",
        overflow: "hidden",
        "&:hover": {
          backgroundColor: (theme) => theme.palette.primary.main,
          color: (theme) => theme.palette.primary.contrastText,
          opacity: 0.8,
        },
      }}
      onClick={onClick}
    >
      {children}
    </Box>
  );
};

const CameraBox = ({ camera, onClick }: { camera: Camera, onClick: () => void }) => {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    if (camera.id !== "new") {
      CamerasService.getRecordingsByCamera(camera.id).then((data) => {
        if(data.length > 0) {
          setVideoData(data[0]);
        }
        setHasCamera(true);
      }).catch(() => {
        setHasCamera(false);
      });
    } else {
      setHasCamera(false);
    }
  }, [camera.id]);

  const cameraViewer = useMemo(() => {
    if (hasCamera) {
      return (
        <Box sx={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, zIndex: -1, overflow: "hidden" }}>
          <CameraViewer videoData={videoData} />
        </Box>
      );
    }
    return null;
  }, [hasCamera, videoData]);

  return (
    <CameraContainer
      key={camera.id}
      onClick={onClick}
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Typography sx={{ mb: 2, lineHeight: 1 }} variant="h5">{camera.name}</Typography>
      <Typography sx={{ mb: 2, lineHeight: 1 }} variant="body1">{camera.description}</Typography>
      {cameraViewer}
    </CameraContainer>
  );
};

const Cameras = () => {
  const [cameras, setCameras] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    CamerasService.listCameras().then((data) => {
      setCameras(data);
    });
  }, []);

  const cameraBoxes = useMemo(() => cameras.map((camera) => (
    <CameraBox key={camera.id} camera={camera} onClick={() => {
      navigate(`/camera/${camera.id}`);
    }} />
  )), [cameras, navigate]);

  return (
    <Container title="Cameras">
      {cameraBoxes}
      <CameraBox
        camera={{
          id: "new",
          name: "Nova camera",
          description: "Crie uma nova camera para monitorar",
        }}
        onClick={() => {
          navigate("/cameras/new", {
            state: {
              camera: {
                id: "new",
              },
            },
          });
        }}
      />
    </Container>
  );
};

export default Cameras;