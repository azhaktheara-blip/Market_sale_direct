import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  FileText,
  CreditCard,
  QrCode,
  Building2,
  Lock,
} from 'lucide-react';
import { farmersApi } from '../../api';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const FarmerProfilePage: React.FC = () => {
  const queryClient = useQueryClient();

  const [farmName, setFarmName] = useState('');
  const [bio, setBio] = useState('');
  const [story, setStory] = useState('');
  const [province, setProvince] = useState('Siem Reap');
  const [district, setDistrict] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [practice, setPractice] = useState('ORGANIC');
  const [years, setYears] = useState(1);
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Banking & QR Setup
  const [bankName, setBankName] = useState('ABA Bank');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bakongAccountId, setBakongAccountId] = useState('');

  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [landCertFile, setLandCertFile] = useState<File | null>(null);
  const [organicDocFile, setOrganicDocFile] = useState<File | null>(null);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

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
  ];

  const banks = [
    'ABA Bank',
    'ACLEDA Bank',
    'Wing Bank',
    'Canadia Bank',
    'Sathapana Bank',
    'Bakong Direct Wallet',
    'Prince Bank',
    'J Trust Royal Bank',
  ];

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-farmer-profile'],
    queryFn: () => farmersApi.getMyProfile().then((res) => res.data),
  });

  useEffect(() => {
    if (profile) {
      setFarmName(profile.farm_name || '');
      setBio(profile.bio || '');
      setStory(profile.story || '');
      setProvince(profile.province || 'Siem Reap');
      setDistrict(profile.district || '');
      setAddressLine(profile.address_line || '');
      setPractice(profile.farming_practice || 'ORGANIC');
      setYears(profile.years_of_experience || 1);
      setPhone(profile.phone_number || '');
      setWebsite(profile.website_url || '');

      setBankName(profile.bank_name || 'ABA Bank');
      setBankAccountName(profile.bank_account_name || profile.farm_name || '');
      setBankAccountNumber(profile.bank_account_number || '');
      setBakongAccountId(profile.bakong_account_id || '');
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => farmersApi.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-farmer-profile'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const verificationMutation = useMutation({
    mutationFn: (formData: FormData) => farmersApi.submitVerification(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-farmer-profile'] });
      setVerifySuccess(true);
      setTimeout(() => setVerifySuccess(false), 3000);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      farm_name: farmName,
      bio,
      story,
      province,
      district,
      address_line: addressLine,
      farming_practice: practice,
      years_of_experience: years,
      phone_number: phone,
      website_url: website,
      bank_name: bankName,
      bank_account_name: bankAccountName,
      bank_account_number: bankAccountNumber,
      bakong_account_id: bakongAccountId,
    });
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    if (idCardFile) formData.append('id_card_image', idCardFile);
    if (landCertFile) formData.append('land_certificate_image', landCertFile);
    if (organicDocFile) formData.append('organic_certification_doc', organicDocFile);
    verificationMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 font-display">Farm Profile, Banking & Verification</h1>
        <p className="text-xs text-stone-500 mt-0.5">Manage your public farm story, direct ABA / Bakong payout credentials, and verified producer status.</p>
      </div>

      {/* Verification Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${
            profile?.is_verified ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {profile?.is_verified ? '✓' : '⏳'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-900 text-sm">Marketplace Trust Badge</h3>
              <Badge
                variant={profile?.is_verified ? 'verified' : 'warning'}
                size="sm"
              >
                {profile?.is_verified ? 'Verified Producer ✓' : profile?.verification_status || 'Pending Verification'}
              </Badge>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {profile?.is_verified
                ? 'Your farm has been verified by administrators and displays the verified trust badge to all buyers.'
                : 'Upload your agricultural documents below for admin review to get verified.'}
            </p>
          </div>
        </div>
      </div>

      {/* Banking & KHQR Credentials Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-forest-700" />
            Direct Banking & Bakong KHQR Setup
          </h2>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Lock className="w-3 h-3" /> Secure Payouts
          </span>
        </div>

        <p className="text-xs text-stone-500">
          When buyers order your crops via <strong>Bakong KHQR</strong> or <strong>Mobile Banking</strong>, the dynamic QR code will automatically route payments to your configured account.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
              Payout Bank / Financial Institution
            </label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 font-semibold"
            >
              {banks.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <Input
            label="Bank Account Name (Full Legal Name)"
            placeholder="e.g. SOKHA ORGANIC FARM CO., LTD."
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value)}
            helperText="Matches your official bank account title."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Bank Account Number"
            placeholder="e.g. 001 234 567 (ABA / ACLEDA)"
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
          />

          <Input
            label="Bakong Account ID (or Phone@Bank)"
            placeholder="e.g. sokha_farm@aba or 012888999@aclb"
            value={bakongAccountId}
            onChange={(e) => setBakongAccountId(e.target.value)}
            helperText="Direct Bakong ID used for EMVCo merchant tagging."
          />
        </div>
      </div>

      {/* Farm Information Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-6">
        <h2 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100">
          Farm Information & Profile Details
        </h2>

        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-forest-50 border border-forest-200 text-forest-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-600" />
            <span>Farm profile & payment settings saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Farm Name" value={farmName} onChange={(e) => setFarmName(e.target.value)} required />
            <Input label="Farm Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">Province</label>
              <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900">
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
            <Input label="District" value={district} onChange={(e) => setDistrict(e.target.value)} required />
            <Input label="Years of Experience" type="number" min="1" value={years} onChange={(e) => setYears(parseInt(e.target.value) || 1)} required />
          </div>

          <Input label="Street / Village Address" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} required />

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">Farming Practice</label>
            <select value={practice} onChange={(e) => setPractice(e.target.value)} className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900">
              <option value="ORGANIC">Certified Organic / Natural</option>
              <option value="REGENERATIVE">Regenerative Agriculture</option>
              <option value="HYDROPONIC">Hydroponic Greenhouse</option>
              <option value="PERMACULTURE">Permaculture</option>
              <option value="CONVENTIONAL">Sustainable Conventional</option>
            </select>
          </div>

          <Input label="Short Farm Hook" value={bio} onChange={(e) => setBio(e.target.value)} required />

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">Complete Farm Story</label>
            <textarea rows={4} value={story} onChange={(e) => setStory(e.target.value)} className="w-full bg-white border border-stone-300 rounded-2xl p-3 text-xs text-stone-900 focus:outline-none focus:border-forest-600" required />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" isLoading={updateProfileMutation.isPending}>
              Save Profile & Payment Setup
            </Button>
          </div>
        </form>
      </div>

      {/* Verification Document Upload */}
      {!profile?.is_verified && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-soft space-y-6">
          <h2 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-forest-600" />
            Submit Verification Credentials
          </h2>

          {verifySuccess && (
            <div className="p-3.5 rounded-2xl bg-forest-50 border border-forest-200 text-forest-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest-600" />
              <span>Verification documents submitted. Our admin team will review them shortly.</span>
            </div>
          )}

          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
                Farmer National ID / Passport Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
                Land Ownership / Agricultural Lease Certificate
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setLandCertFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
                Organic / Cooperative Certification Document (Optional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setOrganicDocFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="amber" size="md" isLoading={verificationMutation.isPending}>
                Submit for Verification
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
