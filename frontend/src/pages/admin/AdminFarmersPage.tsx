import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, X, Eye, FileText, AlertCircle } from 'lucide-react';
import { farmersApi } from '../../api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { FarmerProfile } from '../../types';

export const AdminFarmersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');

  const { data: farmersData, isLoading } = useQuery({
    queryKey: ['admin-farmers', verificationFilter],
    queryFn: () => farmersApi.getAdminFarmers({ verification_status: verificationFilter || undefined }).then((res) => res.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes?: string }) =>
      farmersApi.verifyFarmer(id, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-farmers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setSelectedFarmer(null);
      setAdminNotes('');
    },
  });

  const handleVerify = (action: 'approve' | 'reject') => {
    if (!selectedFarmer) return;
    verifyMutation.mutate({
      id: selectedFarmer.id,
      action,
      notes: adminNotes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-display">Farmer Verification Console</h1>
          <p className="text-xs text-stone-500 mt-0.5">Review agricultural documentation and issue verified producer badges.</p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { label: 'All Farmers', value: '' },
          { label: 'Pending Verification', value: 'PENDING' },
          { label: 'Approved & Verified', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
        ].map((chip) => (
          <button
            key={chip.value}
            onClick={() => setVerificationFilter(chip.value)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
              verificationFilter === chip.value
                ? 'bg-forest-600 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider border-b border-stone-100">
                <tr>
                  <th className="p-4">Farm Name</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Farming Practice</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {farmersData?.results.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4 font-bold text-stone-900">
                      <div className="flex items-center gap-2">
                        <span>{farmer.farm_name}</span>
                        {farmer.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                    </td>
                    <td className="p-4 text-stone-500">{farmer.district ? `${farmer.district}, ` : ''}{farmer.province}</td>
                    <td className="p-4">
                      <span className="font-semibold text-stone-800">{farmer.farming_practice}</span>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={farmer.is_verified ? 'verified' : farmer.verification_status === 'REJECTED' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {farmer.verification_status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedFarmer(farmer)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Review Credentials
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedFarmer}
        onClose={() => setSelectedFarmer(null)}
        title={`Review Farm: ${selectedFarmer?.farm_name}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 space-y-2">
            <p><strong>Province:</strong> {selectedFarmer?.province}</p>
            <p><strong>Address:</strong> {selectedFarmer?.address_line}</p>
            <p><strong>Practice:</strong> {selectedFarmer?.farming_practice}</p>
            <p><strong>Story / Bio:</strong> {selectedFarmer?.bio || selectedFarmer?.story}</p>
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Admin Evaluation Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Verified organic certification with Provincial Department of Agriculture..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button
              variant="danger"
              onClick={() => handleVerify('reject')}
              isLoading={verifyMutation.isPending}
            >
              Reject Application
            </Button>
            <Button
              variant="primary"
              onClick={() => handleVerify('approve')}
              isLoading={verifyMutation.isPending}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Grant Verified Badge ✓
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

