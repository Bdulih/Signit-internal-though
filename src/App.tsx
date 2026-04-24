import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { NewBorrower } from './pages/NewBorrower';
import { SignFlow } from './pages/SignFlow';
import { Done } from './pages/Done';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/borrowers/new" element={<NewBorrower />} />
        <Route path="/borrowers/:id/sign" element={<SignFlow />} />
        <Route path="/borrowers/:id/done" element={<Done />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}
