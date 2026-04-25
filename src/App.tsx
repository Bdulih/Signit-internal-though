import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { NewBorrower } from './pages/NewBorrower';
import { SignFlow } from './pages/SignFlow';
import { Done } from './pages/Done';
import { RolePicker } from './pages/RolePicker';
import { StaffLogin } from './pages/StaffLogin';
import { ClientLogin } from './pages/ClientLogin';
import { ClientHome } from './pages/ClientHome';
import { getSession } from './lib/auth';

function RequireRole({ role, children }: { role: 'staff' | 'client'; children: ReactNode }) {
  const s = getSession();
  const loc = useLocation();
  if (!s) return <Navigate to={role === 'staff' ? '/login/staff' : '/login/client'} replace />;
  if (s.role !== role) return <Navigate to="/" replace />;
  return (
    <Layout>
      <RoleScopeKey key={loc.pathname}>{children}</RoleScopeKey>
    </Layout>
  );
}

function RoleScopeKey({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function ClientSignGate({ children }: { children: ReactNode }) {
  const s = getSession();
  const params = useParams<{ id: string }>();
  if (!s || s.role !== 'client') return <Navigate to="/login/client" replace />;
  if (!s.borrowerId || s.borrowerId !== params.id) return <Navigate to="/sign" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public — no Layout, just role picker / logins */}
      <Route path="/" element={<PublicLayout><RolePicker /></PublicLayout>} />
      <Route path="/login/staff" element={<PublicLayout><StaffLogin /></PublicLayout>} />
      <Route path="/login/client" element={<PublicLayout><ClientLogin /></PublicLayout>} />

      {/* Staff */}
      <Route
        path="/admin"
        element={
          <RequireRole role="staff">
            <Dashboard />
          </RequireRole>
        }
      />
      <Route
        path="/admin/borrowers/new"
        element={
          <RequireRole role="staff">
            <NewBorrower />
          </RequireRole>
        }
      />
      <Route
        path="/admin/borrowers/:id"
        element={
          <RequireRole role="staff">
            <Done />
          </RequireRole>
        }
      />
      <Route
        path="/admin/borrowers/:id/sign"
        element={
          <RequireRole role="staff">
            <SignFlow />
          </RequireRole>
        }
      />

      {/* Client */}
      <Route
        path="/sign"
        element={
          <RequireRole role="client">
            <ClientHome />
          </RequireRole>
        }
      />
      <Route
        path="/sign/:id"
        element={
          <RequireRole role="client">
            <ClientSignGate>
              <SignFlow />
            </ClientSignGate>
          </RequireRole>
        }
      />
      <Route
        path="/sign/:id/done"
        element={
          <RequireRole role="client">
            <ClientSignGate>
              <Done />
            </ClientSignGate>
          </RequireRole>
        }
      />

      {/* Legacy redirects */}
      <Route path="/borrowers/new" element={<Navigate to="/admin/borrowers/new" replace />} />
      <Route path="/borrowers/:id/sign" element={<LegacySignRedirect />} />
      <Route path="/borrowers/:id/done" element={<LegacyDoneRedirect />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <Layout publicView>
      {children}
    </Layout>
  );
}

function LegacySignRedirect() {
  const { id } = useParams<{ id: string }>();
  const s = getSession();
  if (s?.role === 'client') return <Navigate to={`/sign/${id}`} replace />;
  return <Navigate to={`/admin/borrowers/${id}/sign`} replace />;
}
function LegacyDoneRedirect() {
  const { id } = useParams<{ id: string }>();
  const s = getSession();
  if (s?.role === 'client') return <Navigate to={`/sign/${id}/done`} replace />;
  return <Navigate to={`/admin/borrowers/${id}`} replace />;
}
