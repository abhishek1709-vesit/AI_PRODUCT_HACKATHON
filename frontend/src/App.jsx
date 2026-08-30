import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastContext.jsx';
import AppShell from './components/layout/AppShell.jsx';
import LandingPage from './pages/LandingPage.jsx';
import EvaluationsList from './pages/EvaluationsList.jsx';
import EvaluationDetail from './pages/EvaluationDetail.jsx';
import './index.css';

// Wrapper for dashboard routes
function DashboardLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/evaluations" element={<EvaluationsList />} />
            <Route path="/evaluations/:id" element={<EvaluationDetail />} />
          </Route>
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
