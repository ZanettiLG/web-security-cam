import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface ContainerProps {
  children: React.ReactNode;
  title: string;
}

const Container = ({ children, title }: ContainerProps) => {
  return (
    <Box
      component="main"
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        overflow: "hidden",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Box sx={{
        width: "100%",
        backgroundColor: "primary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Typography variant="h1">
          {title}
        </Typography>
      </Box>
      <Box sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default Container;