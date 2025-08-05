const API_URL = "http://localhost:3000/api";

const handleError = (error: Error) => {
  throw error;
};

const request = async (path: string, options?: RequestInit) => {
  return fetch(`${API_URL}${path}`, options)
  .then((res) => res.json())
  .catch(handleError);
};

const listCameras = async () => {
  return request("/cameras");
};

const getCamera = async (id: number) => {
  return request(`/cameras/${id}`);
};

const createCamera = async (cameraData: {
  name?: string;
  username?: string;
  password?: string;
  location?: string;
  ip_address: string;
}) => {
  return request("/cameras", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cameraData),
  });
};

const getRecordingsByCamera = async (id: number) => {
  return request(`/cameras/${id}/recordings`);
};

export default {
  getCamera,
  listCameras,
  createCamera,
  getRecordingsByCamera,
};