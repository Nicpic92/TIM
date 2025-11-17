import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { claimService } from '../services/claimService'; // <-- Import the claim service
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardControlPanel from '../components/dashboard/DashboardControlPanel';
import DashboardContent from '../components/dashboard/DashboardContent';

function DashboardPage() {
  const [configs, setConfigs] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [clientRules, setClientRules] = useState({ editRules: [], noteRules: [] });
  const [allClaimsData, setAllClaimsData] = useState([]);
  const [metrics, setMetrics] = useState(null); // <-- State for summary metrics
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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
      setAllClaimsData([]);
      setMetrics(null);
      return;
    }
    const fetchRules = async () => {
      setIsProcessing(true);
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

  const selectedConfig = configs.find(c => c.id == selectedConfigId);

  // This is the main analysis function
  const handleProcessFile = async (rawData) => {
    if (!selectedConfig) {
      toast.error("Cannot process file without a selected client configuration.");
      return;
    }
    
    setIsProcessing(true);
    toast.loading(`Analyzing ${rawData.length} records...`);

    try {
      // Use a timeout to allow the UI to update before this heavy computation
      await new Promise(resolve => setTimeout(resolve, 50));

      const { claims, metrics: newMetrics } = claimService.analyzeAndProcessClaims(
        rawData,
        selectedConfig.config_data.columnMappings,
        clientRules
      );

      setAllClaimsData(claims);
      setMetrics(newMetrics);
      toast.dismiss();
      toast.success('Analysis complete!');
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.dismiss();
      toast.error(error.message || "An error occurred during claims analysis.");
    } finally {
      setIsProcessing(false);
    }
  };

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
          metrics={metrics}
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
