import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
// We will create these components next
import DashboardControlPanel from '../components/dashboard/DashboardControlPanel';
import DashboardContent from '../components/dashboard/DashboardContent';

function DashboardPage() {
  const [configs, setConfigs] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [clientRules, setClientRules] = useState({ editRules: [], noteRules: [] });
  const [allClaimsData, setAllClaimsData] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // For file processing

  // Fetch all configurations on initial load
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const fetchedConfigs = await apiService.getConfigs();
        setConfigs(fetchedConfigs);
      } catch (error) {
        toast.error(error.message || 'Failed to load configurations.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  // Fetch client-specific rules when a configuration is selected
  useEffect(() => {
    if (!selectedConfigId) {
      setClientRules({ editRules: [], noteRules: [] });
      setAllClaimsData([]); // Clear data when config changes
      return;
    }
    const fetchRules = async () => {
      setIsProcessing(true); // Use processing state to show loading
      try {
        const [editRules, noteRules] = await Promise.all([
          apiService.getRules('edit', selectedConfigId),
          apiService.getRules('note', selectedConfigId)
        ]);
        setClientRules({ editRules, noteRules });
      } catch (error) {
        toast.error(error.message || 'Failed to load client rules.');
      } finally {
        setIsProcessing(false);
      }
    };
    fetchRules();
  }, [selectedConfigId]);

  const handleProcessFile = async (claimsData) => {
    // Placeholder for the main claims analysis logic
    setIsProcessing(true);
    toast.success(`Processing ${claimsData.length} records... Analysis logic to be implemented.`);
    
    // We will replace this with the real processing logic soon
    console.log("Raw claims data:", claimsData);
    console.log("Using rules:", clientRules);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, just store the raw data to show the content area
    setAllClaimsData(claimsData); 
    setIsProcessing(false);
  };

  const selectedConfig = configs.find(c => c.id == selectedConfigId);

  if (isLoading) {
    return <LoadingSpinner fullPage={true} />;
  }

  return (
    <div>
      <DashboardControlPanel
        configs={configs}
        selectedConfig={selectedConfig}
        onConfigChange={setSelectedConfigId}
        onProcessFile={handleProcessFile}
        isProcessing={isProcessing}
      />

      {isProcessing ? (
        <LoadingSpinner fullPage={true} />
      ) : allClaimsData.length > 0 ? (
        <DashboardContent 
          claimsData={allClaimsData}
          // We will pass more props here later (metrics, etc.)
        />
      ) : (
        <div className="mt-4 text-center">
          <div className="alert alert-light">Please select a configuration and upload a claims report to begin.</div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
