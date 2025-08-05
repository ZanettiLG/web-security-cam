import { 
  Route,
  Routes, 
  BrowserRouter, 
} from 'react-router-dom';
import Cameras from './pages/Cameras';
import Camera from './pages/Cameras/Camera';
import Recordings from './pages/Recordings';
import CreateCamera from './pages/Cameras/CreateCamera';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Cameras />} />
        <Route path="/camera/:id" element={<Camera />} />
        <Route path="/cameras/new" element={<CreateCamera />} />
        <Route path="/recordings" element={<Recordings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
