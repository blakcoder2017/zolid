import React, { useState } from 'react';
import { Button } from '@zolid/shared/components';
import apiClient from '@zolid/shared/utils/apiClient';

const RaiseDisputeModal = ({ jobId, onClose, onSuccess }) => {
  const [category, setCategory] = useState('POOR_QUALITY');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/disputes/raise', {
        job_id: jobId,
        category,
        description,
        evidence_urls: [] // Handle photo upload if needed later
      });
      alert('Dispute raised. Our support team has been notified.');
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to raise dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-coral-600 mb-4">Report an Issue</h2>
        <p className="text-sm text-gray-600 mb-4">
          Raising a dispute will <strong>freeze the funds</strong> until ZOLID admin intervenes.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Issue Type</label>
            <select 
              className="w-full border rounded p-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="POOR_QUALITY">Poor Quality Work</option>
              <option value="ARTISAN_ABSENT">Artisan No-Show</option>
              <option value="CLIENT_UNRESPONSIVE">Client Unresponsive</option>
              <option value="REFUSAL_TO_PAY">Refusal to Sign-off</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea 
              className="w-full border rounded p-2 h-24"
              placeholder="Please describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting} className="bg-coral-600">
              {submitting ? 'Submitting...' : 'Freeze Funds & Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RaiseDisputeModal;