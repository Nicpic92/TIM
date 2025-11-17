import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { fileService } from '../../services/fileService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import UncategorizedRulesTable from './UncategorizedRulesTable'; // We will create this next

/**
 * Manages the UI for discovering and assigning new categorization rules.
 */
function RuleDiscoveryManager({ configs, categories, onDataChange }) {
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [existingRules, setExistingRules] = useState({ editRules: new Set(), noteRules: new Set() });
  const [uncategorizedItems, setUncategorizedItems] = useState({ edits: [], notes: [] });

  const selectedConfig = configs.find(c => c.id == selectedConfigId);
  const canUpload = selectedConfig?.config_data?.columnMappings?.edit && selectedConfig?.config_data?.columnMappings?.notes;

  useEffect(() => {
    if (!selectedConfigId) {
      setExistingRules({ editRules: new Set(), noteRules: new Set() });
      setUncategorizedItems({ edits: [], notes: [] });
      return;
    }

    const fetchRules = async () => {
      setIsLoadingRules(true);
      setUncategorizedItems({ edits: [], notes: [] });
      try {
        const [editRules, noteRules] = await Promise.all([
          apiService.getRules('edit', selectedConfigId),
          apiService.getRules('note', selectedConfigId),
        ]);
        setExistingRules({
          editRules: new Set(editRules.map(r => r.text)),
          noteRules: new Set(noteRules.map(r => r.text)),
        });
      } catch (error) {
        toast.error(error.message || 'Failed to fetch existing rules.');
      } finally {
        setIsLoadingRules(false);
      }
    };

    fetchRules();
  }, [selectedConfigId]);

  const handleFileProcess = async (file) => {
    if (!file) return;
    setIsProcessingFile(true);
    setUncategorizedItems({ edits: [], notes: [] });

    try {
      const data = await fileService.parseXlsxFile(file);
      const { edit: editCol, notes: notesCol } = selectedConfig.config_data.columnMappings;
      
      const newEdits = new Set();
      const newNotes = new Set();

      data.forEach(row => {
        const editValue = row[editCol] ? String(row[editCol]).trim() : '';
        if (editValue && !existingRules.editRules.has(editValue)) {
          newEdits.add(editValue);
        }

        const noteValue = row[notesCol] ? String(row[notesCol]).trim() : '';
        if (noteValue && !existingRules.noteRules.has(noteValue)) {
          newNotes.add(noteValue);
        }
      });

      setUncategorizedItems({
        edits: Array.from(newEdits).sort().map(text => ({ text, category_id: '' })),
        notes: Array.from(newNotes).sort().map(text => ({ text, category_id: '' })),
      });
      
      if (newEdits.size === 0 && newNotes.size === 0) {
        toast.success('File processed. No new, uncategorized items were found.');
      }

    } catch (error) {
      toast.error(error.message || 'Failed to process file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleCategoryChange = (type, index, categoryId) => {
    setUncategorizedItems(prev => {
      const newItems = [...prev[type]];
      newItems[index].category_id = categoryId;
      return { ...prev, [type]: newItems };
    });
  };

  const handleSaveRules = async () => {
    const editsToSave = uncategorizedItems.edits
      .filter(item => item.category_id)
      .map(item => ({ text: item.text, category_id: parseInt(item.category_id, 10) }));

    const notesToSave = uncategorizedItems.notes
      .filter(item => item.category_id)
      .map(item => ({ text: item.text, category_id: parseInt(item.category_id, 10) }));

    if (editsToSave.length === 0 && notesToSave.length === 0) {
      toast.error('No rules have been assigned to a category.');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving new rules...');

    try {
      const promises = [];
      if (editsToSave.length > 0) {
        promises.push(apiService.saveRules('edit', selectedConfigId, editsToSave));
      }
      if (notesToSave.length > 0) {
        promises.push(apiService.saveRules('note', selectedConfigId, notesToSave));
      }
      await Promise.all(promises);

      toast.success('New rules saved successfully!', { id: toastId });
      await onDataChange(); // Refetch all data to update everything
    } catch (error) {
       toast.error(error.message || 'Failed to save rules.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };
  
  const hasUncategorizedItems = uncategorizedItems.edits.length > 0 || uncategorizedItems.notes.length > 0;

  return (
    <div>
      {/* Client Selector and File Uploader */}
      <div className="row bg-light p-3 rounded mb-3 align-items-end">
        <div className="col-md-6">
          <label className="form-label fw-bold">1. Select Client</label>
          <select
            className="form-select"
            value={selectedConfigId}
            onChange={(e) => setSelectedConfigId(e.target.value)}
            disabled={isProcessingFile || isSaving}
          >
            <option value="">Select a client...</option>
            {configs.map(config => (
              <option key={config.id} value={config.id}>{config.config_name}</option>
            ))}
          </select>
          {isLoadingRules && <small className="text-muted d-block mt-1"><LoadingSpinner /> Loading existing rules...</small>}
        </div>
        <div className="col-md-6">
          <label className="form-label fw-bold">2. Upload Report to Discover Rules</label>
          <input
            className="form-control"
            type="file"
            accept=".xlsx"
            disabled={!selectedConfigId || !canUpload || isProcessingFile || isLoadingRules || isSaving}
            onChange={(e) => handleFileProcess(e.target.files[0])}
            key={selectedConfigId}
          />
          {selectedConfigId && !canUpload && (
            <small className="text-danger">
              This config must map "Claim Edits" and "Claim Notes" to discover rules.
            </small>
          )}
        </div>
      </div>

      {/* Results and Assignment Section */}
      {isProcessingFile ? (
        <LoadingSpinner fullPage={true} />
      ) : hasUncategorizedItems ? (
        <div>
          <button className="btn btn-success mb-3" onClick={handleSaveRules} disabled={isSaving}>
            {isSaving ? <><LoadingSpinner /> Saving...</> : 'Save All Rule Assignments'}
          </button>
          
          <UncategorizedRulesTable 
            title="Uncategorized Claim Edits"
            items={uncategorizedItems.edits}
            categories={categories}
            onCategoryChange={(index, catId) => handleCategoryChange('edits', index, catId)}
          />

          <UncategorizedRulesTable 
            title="Uncategorized Claim Notes"
            items={uncategorizedItems.notes}
            categories={categories}
            onCategoryChange={(index, catId) => handleCategoryChange('notes', index, catId)}
            className="mt-4"
          />
        </div>
      ) : (
        <div className="alert alert-info">
          {selectedConfigId ? 'Upload a file to begin the discovery process.' : 'Select a client to begin.'}
        </div>
      )}
    </div>
  );
}

export default RuleDiscoveryManager;
