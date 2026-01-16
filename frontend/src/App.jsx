import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing.jsx';
import VideoMeet from './pages/videoMeet.jsx';
// import Authentication from './pages/authentication.jsx';

function App() {
  return (
    <div className='App'>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/:url" element={<VideoMeet />} />
        </Routes>
      </Router>
    </div>
  );
}
export default App
