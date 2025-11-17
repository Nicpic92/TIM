import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

// Import required components
import LoadingSpinner from '../components/common/LoadingSpinner';
// NEW: Import the ReportBuilder component from the new directory
import ReportBuilder from '../components/reports/ReportBuilder';

function ReportsPage() {
  const [initialData, setInitialData] = useState({
    teams: [],
    categories: [],
    reportConfigs: [], // New state to hold report configurations
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch all necessary data for the Report Builder page
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [teams, categories, reportConfigs] = await Promise.all([
        apiService.getTeams(), // Fetches all teams
        apiService.getCategories(), // Fetches all categories
        apiService.getTeamReportConfigs(), // Fetches all existing report configs
      ]);
      setInitialData({ teams, categories, reportConfigs });
      setError(null);
    } catch (err) {
      console.error('Failed to load report data:', err);
      setError('Failed to load essential report data. Please refresh the page.');
      toast.error(err.message || 'A network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Render loading state
  if (isLoading) {
    return <LoadingSpinner fullPage={true} />;
  }

  // Render error state
  if (error) {
    return (
      <div className="alert alert-danger">
        <h4 className="alert-heading">Error</h4>
        <p>{error}</p>
      </div>
    );
  }

  // Render the Report Builder content
  return (
    <div>
      <h1 className="mb-4">Universal Report Builder</h1>
      <ReportBuilder 
        teams={initialData.teams}
        categories={initialData.categories}
        reportConfigs={initialData.reportConfigs}
        onDataChange={fetchData} // Pass the refetch function
      />
    </div>
  );
}

export default ReportsPage;
