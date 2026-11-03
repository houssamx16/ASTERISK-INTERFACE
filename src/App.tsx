import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExtensionsPage } from './pages/ExtensionsPage';
import { DialplanPage } from './pages/DialplanPage';
import { ServicesPage } from './pages/ServicesPage';
import { CallCenterPage } from './pages/CallCenterPage';
import { IvrPage } from './pages/IvrPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { CdrPage } from './pages/CdrPage';
import { BackupPage } from './pages/BackupPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="extensions" element={<ExtensionsPage />} />
                <Route path="dialplan" element={<DialplanPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="callcenter" element={<CallCenterPage />} />
                <Route path="ivr" element={<IvrPage />} />
                <Route path="monitoring" element={<MonitoringPage />} />
                <Route path="cdr" element={<CdrPage />} />
                <Route path="backup" element={<BackupPage />} />
              </Route>
            </Route>

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
