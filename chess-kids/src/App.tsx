import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import { Home } from './pages/Home';
import { LessonPage } from './pages/LessonPage';
import { ProfileSelect } from './pages/ProfileSelect';
import './App.css';

function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/profiles" element={<ProfileSelect />} />
            <Route path="/" element={<Home />} />
            <Route path="/lesson/:id" element={<LessonPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ProfileProvider>
  );
}

export default App;
