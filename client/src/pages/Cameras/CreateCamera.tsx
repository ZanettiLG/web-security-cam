import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Container from "../../components/Container";
import camerasService from "../../services/cameras";

interface CameraFormData {
  ip_address: string;
  username: string;
  password: string;
  name: string;
  location: string;
}

const CreateCamera: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CameraFormData>({
    ip_address: "",
    username: "",
    password: "",
    name: "",
    location: "",
  });

  const handleInputChange = (field: keyof CameraFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.ip_address.trim()) {
        throw new Error("IP address is required");
      }

      // IP validation is now handled by IPField component
      if (formData.ip_address.split(".").length !== 4) {
        throw new Error("Please enter a complete IP address");
      }

      await camerasService.createCamera({
        ip_address: formData.ip_address.trim(),
        username: formData.username.trim() || undefined,
        password: formData.password.trim() || undefined,
        name: formData.name.trim() || undefined,
        location: formData.location.trim() || undefined,
      });

      // Redirect to cameras list on success
      navigate("/cameras");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create camera");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/cameras");
  };

  return (
    <Container title="Create Camera">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: "100%",
          mx: 2,
        }}
      >
        <Typography variant="h4" component="h2" gutterBottom>
          Add New Camera
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="IP Address"
                value={formData.ip_address}
                onChange={handleInputChange("ip_address")}
                placeholder="192.168.1.100"
                disabled={loading}
                helperText="Enter the camera's IP address"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={handleInputChange("username")}
                placeholder="admin"
                disabled={loading}
                helperText="Camera login username (optional)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange("password")}
                placeholder="••••••••"
                disabled={loading}
                helperText="Camera login password (optional)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Camera Name"
                value={formData.name}
                onChange={handleInputChange("name")}
                placeholder="Front Door Camera"
                disabled={loading}
                helperText="A friendly name for the camera (optional)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleInputChange("location")}
                placeholder="Front Door"
                disabled={loading}
                helperText="Camera location (optional)"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !formData.ip_address.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? "Creating..." : "Create Camera"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateCamera;
