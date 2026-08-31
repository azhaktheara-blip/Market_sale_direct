import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Trash2, Home, Navigation, ExternalLink, Compass } from 'lucide-react';
import { addressesApi } from '../../api';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Skeleton';
import type { Address } from '../../types';

export const CustomerAddressesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [label, setLabel] = useState('Restaurant Kitchen');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('Siem Reap');
  const [district, setDistrict] = useState('Siem Reap');
  const [street, setStreet] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const provinces = [
    'Siem Reap',
    'Battambang',
    'Kampot',
    'Kandal',
    'Pursat',
    'Koh Kong',
    'Mondulkiri',
    'Takeo',
    'Kampong Cham',
    'Kratie',
    'Phnom Penh',
  ];

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.getAddresses().then((res) => res.data),
  });

  const createAddressMutation = useMutation({
    mutationFn: (data: Partial<Address>) => addressesApi.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsAddModalOpen(false);
      resetForm();
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => addressesApi.deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => addressesApi.updateAddress(id, { is_default: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const resetForm = () => {
    setLabel('Restaurant Kitchen');
    setRecipientName('');
    setPhone('');
    setProvince('Siem Reap');
    setDistrict('Siem Reap');
    setStreet('');
    setLatitude(null);
    setLongitude(null);
    setIsDefault(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        alert('Could not retrieve GPS coordinates. You can still enter your address manually.');
      },
      { timeout: 10000 }
    );
  };

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    createAddressMutation.mutate({
      label,
      recipient_name: recipientName,
      phone_number: phone,
      province,
      district,
      street_address: street,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      is_default: isDefault,
    });
  };

  const getGoogleMapsUrl = (addr: Address) => {
    if (addr.latitude && addr.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`;
    }
    const query = `${addr.street_address}, ${addr.district}, ${addr.province}, Cambodia`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-display">Delivery Addresses</h1>
          <p className="text-xs text-stone-500 mt-0.5">Manage locations with Google Maps & GPS for exact crate drop-offs.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Address
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      ) : addresses?.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-stone-300 space-y-3">
          <MapPin className="w-8 h-8 text-forest-600 mx-auto" />
          <h3 className="text-sm font-bold text-stone-900">No addresses saved</h3>
          <p className="text-xs text-stone-500">Add your first delivery location for 1-click checkout and farm dispatch.</p>
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            Add Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses?.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-3xl border transition-all bg-white flex flex-col justify-between space-y-4 ${
                addr.is_default ? 'border-forest-600 shadow-soft ring-1 ring-forest-100' : 'border-stone-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-forest-600" />
                    {addr.label}
                  </span>
                  {addr.is_default ? (
                    <span className="text-[10px] font-bold text-forest-800 bg-forest-100 px-2.5 py-0.5 rounded-full">
                      Default Delivery
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefaultMutation.mutate(addr.id)}
                      className="text-[11px] text-stone-400 hover:text-forest-700 font-semibold"
                    >
                      Set as default
                    </button>
                  )}
                </div>

                <p className="text-xs font-bold text-stone-800">{addr.recipient_name}</p>
                <p className="text-xs text-stone-600 mt-1">{addr.street_address}</p>
                <p className="text-xs text-stone-400">{addr.district ? `${addr.district}, ` : ''}{addr.province}, Cambodia</p>
                <p className="text-[11px] text-stone-500 mt-1 font-mono">{addr.phone_number}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs">
                {/* Google Maps link */}
                <a
                  href={getGoogleMapsUrl(addr)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-forest-700 hover:text-forest-900 font-bold bg-forest-50 hover:bg-forest-100 px-3 py-1.5 rounded-xl transition-colors text-[11px]"
                >
                  <Compass className="w-3.5 h-3.5 text-forest-600" />
                  <span>View on Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </a>

                <button
                  onClick={() => deleteAddressMutation.mutate(addr.id)}
                  className="text-stone-300 hover:text-rose-600 p-1.5 transition-colors rounded-lg hover:bg-rose-50"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal with GPS & Google Maps */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Delivery Address" maxWidth="md">
        <form onSubmit={handleCreateAddress} className="space-y-4">
          <Input
            label="Address Label"
            placeholder="e.g. Haven Restaurant Kitchen, Main Villa, Resort Hub"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Recipient Full Name" placeholder="e.g. Som Dara" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
            <Input label="Phone Number" placeholder="+855 12 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">Province</label>
              <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900">
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
            <Input label="District" value={district} onChange={(e) => setDistrict(e.target.value)} required />
          </div>

          <Input label="Street Address / Building" placeholder="e.g. Wat Bo Road, House #45B" value={street} onChange={(e) => setStreet(e.target.value)} required />

          {/* GPS Pin Finder */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-2">
            <div className="text-[11px] text-stone-600">
              {latitude && longitude ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              ) : (
                <span className="text-stone-500">Attach precise GPS coordinates for delivery driver navigation.</span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              isLoading={isLocating}
              className="text-[11px] font-bold text-forest-800 border-forest-200 hover:bg-forest-100 shrink-0"
              leftIcon={<Navigation className="w-3 h-3 text-forest-600" />}
            >
              {latitude ? 'Update GPS' : 'Auto-Detect GPS'}
            </Button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4 text-forest-600 rounded border-stone-300" />
            <span className="text-xs font-semibold text-stone-700">Set as default delivery address</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createAddressMutation.isPending}>Save Address</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
