import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifySignup from './pages/VerifySignup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Budget from './pages/Budget';
import FinOps from './pages/FinOps';
import Simulation from './pages/Simulation';
import Settings from './pages/Settings';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import { useAuthStore } from './store/authStore';
import { ACCESS, ROLES, getHomePath } from './utils/roles';
import HtmlLang from './components/HtmlLang';

function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={getHomePath(user)} replace />;
}

function AuthenticatedHomeGate() {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to={getHomePath(user)} replace />;
  }
  return <Login />;
}

function RegisterGate() {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to={getHomePath(user)} replace />;
  }
  return <Register />;
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
        <Route path="/register" element={<RegisterGate />} />
        <Route path="/verify-signup" element={<VerifySignup />} />
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
          <Route
            path="projects"
            element={
              <ProtectedRoute requiredRoles={ACCESS.DASHBOARD}>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="projects/:id"
            element={
              <ProtectedRoute requiredRoles={ACCESS.DASHBOARD}>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="companies"
            element={
              <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
                <Companies />
              </ProtectedRoute>
            }
          />
          <Route
            path="companies/:id"
            element={
              <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
                <CompanyDetail />
              </ProtectedRoute>
            }
          />
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

