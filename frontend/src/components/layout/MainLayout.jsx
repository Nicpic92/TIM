import { Outlet, Link } from 'react-router-dom';
// REMOVED the problematic import: import mirraLogo from '../../../public/logo.png'; 
// Assuming logo is in the public folder

function MainLayout() {
  return (
    <div className="container-fluid p-4">
      <header className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <img
            // FIXED: Using absolute path '/logo.png' to directly reference the public asset.
            src="/logo.png" 
            alt="Mirra Logo"
            style={{ height: '24px', marginBottom: '10px' }}
          />
  
          <h1 className="display-6" style={{ color: '#0d6efd' }}>
            Claims Dashboard & Analytics
          </h1>
        </div>
        <nav>
          <Link to="/" className="btn btn-outline-primary me-2">
            Dashboard
          </Link>
          
          <Link to="/admin" className="btn btn-outline-secondary me-2">
            Admin Console
          </Link>
           <Link to="/reports" className="btn btn-outline-info">
            Report Builder
          </Link>
        </nav>
      </header>

      <main>
        {/* Child routes (DashboardPage, AdminPage, etc.) will be 
rendered here */}
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
