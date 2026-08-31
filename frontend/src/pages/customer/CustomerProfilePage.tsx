import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { CheckCircle2 } from 'lucide-react';

export const CustomerProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [businessName, setBusinessName] = useState(user?.customer_profile?.business_name || '');
  const [businessType, setBusinessType] = useState(user?.customer_profile?.business_type || 'INDIVIDUAL');
  const [deliveryNotes, setDeliveryNotes] = useState(user?.customer_profile?.delivery_instructions || '');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await authApi.updateProfile({
        username,
        phone_number: phone,
        business_name: businessName,
        business_type: businessType,
        delivery_instructions: deliveryNotes,
      });
      updateUser(res.data);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 font-display">Profile Settings</h1>
        <p className="text-xs text-stone-500 mt-0.5">Manage your personal information and buyer preferences.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 text-forest-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-forest-600" />
          <span>Profile updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-5">
        <Input label="Email Address" value={user?.email || ''} disabled className="bg-stone-50 text-stone-500 cursor-not-allowed" helperText="Email address cannot be changed." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>

        <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Business / Restaurant Name" placeholder="e.g. Haven Bistro" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">Buyer Type</label>
            <select value={businessType} onChange={(e) => setBusinessType(e.target.value as any)} className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900">
              <option value="INDIVIDUAL">Individual Consumer</option>
              <option value="RESTAURANT">Restaurant / Cafe</option>
              <option value="HOTEL">Hotel / Resort</option>
              <option value="LOCAL_STORE">Local Grocery Store</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">Default Delivery Instructions</label>
          <textarea rows={3} placeholder="e.g. Ring front gate bell, leave crate inside..." value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} className="w-full bg-white border border-stone-300 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-forest-600" />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

