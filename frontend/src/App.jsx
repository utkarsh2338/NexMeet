import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landing.jsx';
import VideoMeet from './pages/videoMeet.jsx';
import HomeComponent from './pages/home.jsx';
import HistoryPage from './pages/history.jsx';
import { AppStateProvider } from './context/AppContext';

function App() {
  return (
    <AppStateProvider>
      <div className='App'>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<HomeComponent />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/:url" element={<VideoMeet />} />
          </Routes>
        </Router>
      </div>
    </AppStateProvider>
  );
}
export default App
