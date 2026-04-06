import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Budget from './pages/Budget';
import FinOps from './pages/FinOps';
import Simulation from './pages/Simulation';
import Settings from './pages/Settings';
import { useAuthStore } from './store/authStore';
import { ACCESS, getHomePath } from './utils/roles';
import HtmlLang from './components/HtmlLang';

function HomeRedirect() {
  return <Navigate to={getHomePath()} replace />;
}

function AuthenticatedHomeGate() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to={getHomePath()} replace />;
  }
  return <Login />;
}

function App() {
  useEffect(() => {
    const handlePointerMove = (event) => {
      const targetCard = event.target.closest('.spotlight-card');
      if (!targetCard) return;

      const rect = targetCard.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      targetCard.style.setProperty('--spotlight-x', `${x}px`);
      targetCard.style.setProperty('--spotlight-y', `${y}px`);
    };

    document.addEventListener('pointermove', handlePointerMove);
    return () => document.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return (
    <BrowserRouter>
      <HtmlLang />
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<AuthenticatedHomeGate />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeRedirect />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute requiredRoles={ACCESS.DASHBOARD}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route
            path="budget"
            element={
              <ProtectedRoute requiredRoles={ACCESS.BUDGET_PAGE}>
                <Budget />
              </ProtectedRoute>
            }
          />
          <Route
            path="finops"
            element={
              <ProtectedRoute requiredRoles={ACCESS.FINOPS_PAGE}>
                <FinOps />
              </ProtectedRoute>
            }
          />
          <Route
            path="simulation"
            element={
              <ProtectedRoute requiredRoles={ACCESS.SIMULATION_PAGE}>
                <Simulation />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

