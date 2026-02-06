import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import { Home } from './pages/Home';
import { LessonPage } from './pages/LessonPage';
import { ProfileSelect } from './pages/ProfileSelect';
import { AdventureSummary } from './pages/AdventureSummary';
import './App.css';

// Wrapper to force remount of LessonPage when ID changes
function LessonPageWrapper() {
  const { id } = useParams<{ id: string }>();
  return <LessonPage key={id} />;
}

function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/profiles" element={<ProfileSelect />} />
            <Route path="/" element={<Home />} />
            <Route path="/lesson/:id" element={<LessonPageWrapper />} />
            <Route path="/certificate" element={<AdventureSummary />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ProfileProvider>
  );
}

export default App;