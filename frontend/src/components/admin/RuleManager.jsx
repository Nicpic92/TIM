import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import ExistingRulesTable from './ExistingRulesTable'; // We will create this next

/**
 * Manages the UI for viewing, updating, and deleting existing categorization rules.
 */
function RuleManager({ configs, categories, onDataChange }) {
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State to hold the rules as they are being edited
  const [editRules, setEditRules] = useState([]);
  const [noteRules, setNoteRules] = useState([]);

  // Fetch rules when a client is selected
  useEffect(() => {
    if (!selectedConfigId) {
      setEditRules([]);
      setNoteRules([]);
      return;
    }

    const fetchRules = async () => {
      setIsLoading(true);
      try {
        const [fetchedEdits, fetchedNotes] = await Promise.all([
          apiService.getRules('edit', selectedConfigId),
          apiService.getRules('note', selectedConfigId),
        ]);
        setEditRules(fetchedEdits);
        setNoteRules(fetchedNotes);
      } catch (error) {
        toast.error(error.message || 'Failed to fetch rules.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRules();
  }, [selectedConfigId]);

  const handleCategoryChange = (ruleType, index, newCategoryId) => {
    const updater = ruleType === 'edit' ? setEditRules : setNoteRules;
    updater(prevRules => {
      const newRules = [...prevRules];
      newRules[index].category_id = parseInt(newCategoryId, 10);
      return newRules;
    });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving changes...');

    try {
      // We can just send the entire list; the backend upsert logic handles it.
      const editPromise = apiService.saveRules('edit', selectedConfigId, editRules);
      const notePromise = apiService.saveRules('note', selectedConfigId, noteRules);
      await Promise.all([editPromise, notePromise]);

      toast.success('Changes saved successfully!', { id: toastId });
      // No need to refetch, the state is already current.
    } catch (error) {
      toast.error(error.message || 'Failed to save changes.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (ruleType, ruleText) => {
     if (!window.confirm(`Are you sure you want to permanently delete this rule?\n\nRULE: ${ruleText}`)) {
      return;
    }
    const toastId = toast.loading('Deleting rule...');
    try {
      await apiService.deleteRule(ruleType, selectedConfigId, ruleText);
      toast.success('Rule deleted successfully!', { id: toastId });
      // Refetch all data to ensure categories and rules lists are updated everywhere
      await onDataChange();
    } catch (error) {
       toast.error(error.message || 'Failed to delete rule.', { id: toastId });
    }
  };


  return (
    <div>
      <div className="d-flex justify-content-between align-items-end mb-3">
        <div>
          <label htmlFor="clientRuleFilter" className="form-label">
            Filter by Client
          </label>
          <select
            id="clientRuleFilter"
            className="form-select form-select-sm"
            value={selectedConfigId}
            onChange={(e) => setSelectedConfigId(e.target.value)}
          >
            <option value="">Select a Client...</option>
            {configs.map(c => <option key={c.id} value={c.id}>{c.config_name}</option>)}
          </select>
        </div>
        {/* We can add download/copy buttons here later */}
      </div>

      {isLoading ? (
        <LoadingSpinner fullPage={false} />
      ) : selectedConfigId && (
        <>
          <button className="btn btn-success mb-3" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <><LoadingSpinner /> Saving...</> : 'Save All Changes to Existing Rules'}
          </button>
          <div className="row">
            <div className="col-md-6">
              <ExistingRulesTable 
                title="Claim Edit Rules"
                rules={editRules}
                categories={categories}
                ruleType="edit"
                onCategoryChange={handleCategoryChange}
                onDeleteRule={handleDeleteRule}
              />
            </div>
            <div className="col-md-6">
               <ExistingRulesTable 
                title="Claim Note Rules"
                rules={noteRules}
                categories={categories}
                ruleType="note"
                onCategoryChange={handleCategoryChange}
                onDeleteRule={handleDeleteRule}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RuleManager;
