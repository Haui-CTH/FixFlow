// SPDX-License-Identifier: Apache-2.0
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Tickets from './pages/Tickets';
import Notifications from './pages/Notifications';
import TicketCreate from './pages/TicketCreate';
import NotFound from './pages/NotFound';
import { AuthGuard } from './components/AuthGuard';
import { RoleGuard } from './components/RoleGuard';
import { SkeletonBlock } from './components/ui/Skeleton';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));

const fallback = <SkeletonBlock height={320} />;

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={fallback}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route
              index
              element={
                <RoleGuard roles={['admin', 'manager']}>
                  <Dashboard />
                </RoleGuard>
              }
            />
            <Route
              path="tickets"
              element={
                <RoleGuard roles={['admin', 'manager']}>
                  <Tickets />
                </RoleGuard>
              }
            />
            <Route path="my-tickets" element={<Tickets mine />} />
            <Route
              path="tickets/new"
              element={
                <RoleGuard roles={['customer', 'manager', 'admin']} deniedMessage="Bạn không có quyền tạo ticket">
                  <TicketCreate />
                </RoleGuard>
              }
            />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
