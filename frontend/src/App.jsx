import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Page Components (we will create these next)
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ReportsPage from './pages/ReportsPage';

// Import Layout Component (we will create this next)
// FIXED: Added '.jsx' extension for proper resolution in production build
import MainLayout from './components/layout/MainLayout.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All pages will share the MainLayout component */}
        <Route path="/" element={<MainLayout />}>
          {/* The default page to render at "/" */}
          <Route index element={<DashboardPage />} />
          
          {/* The page to render at "/admin" */}
          <Route path="admin" element={<AdminPage />} />
          
          {/* The page to render at "/reports" */}
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
