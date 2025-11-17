import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

// Import child components (we will create these next)
import LoadingSpinner from '../components/common/LoadingSpinner';
import ClientConfigManager from '../components/admin/ClientConfigManager';
import CategorizationManager from '../components/admin/CategorizationManager';

function AdminPage() {
  const [initialData, setInitialData] = useState({
    teams: [],
    categories: [],
    configs: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch all necessary data for the admin page
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [teams, categories, configs] = await Promise.all([
        apiService.getTeams(),
        apiService.getCategories(),
        apiService.getConfigs(),
      ]);
      setInitialData({ teams, categories, configs });
      setError(null);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError('Failed to load essential admin data. Please refresh the page.');
      toast.error(err.message || 'A network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Render a loading state
  if (isLoading) {
    return <LoadingSpinner fullPage={true} />;
  }

  // Render an error state
  if (error) {
    return (
      <div className="alert alert-danger">
        <h4 className="alert-heading">Error</h4>
        <p>{error}</p>
      </div>
    );
  }

  // Render the main content when data is loaded
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Admin Console</h1>
      </div>

      <div className="row g-5">
        <div className="col-12">
          <ClientConfigManager
            configs={initialData.configs}
            onConfigChange={fetchData} // Pass the refetch function
          />
        </div>
      </div>

      <div className="row g-5 mt-4">
        <div className="col-12">
          <CategorizationManager
            teams={initialData.teams}
            categories={initialData.categories}
            configs={initialData.configs}
            onDataChange={fetchData} // Pass the refetch function
          />
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
