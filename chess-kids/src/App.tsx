import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import './App.css';

const Home = lazy(async () => {
  const module = await import('./pages/Home');
  return { default: module.Home };
});

const LessonPage = lazy(async () => {
  const module = await import('./pages/LessonPage');
  return { default: module.LessonPage };
});

const ProfileSelect = lazy(async () => {
  const module = await import('./pages/ProfileSelect');
  return { default: module.ProfileSelect };
});

const NotFound = lazy(async () => {
  const module = await import('./pages/NotFound');
  return { default: module.NotFound };
});

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
          <Suspense fallback={<div className="route-loading">Loading...</div>}>
            <Routes>
              <Route path="/profiles" element={<ProfileSelect />} />
              <Route path="/" element={<Home />} />
              <Route path="/lesson/:id" element={<LessonPageWrapper />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </ProfileProvider>
  );
}

export default App;
