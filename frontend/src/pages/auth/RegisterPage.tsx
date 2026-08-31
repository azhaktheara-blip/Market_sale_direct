import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sprout, Mail, Lock, User as UserIcon, Phone, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

const registerSchema = z.object({
  role: z.enum(['CUSTOMER', 'FARMER']),
  email: z.string().email('Please enter a valid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone_number: z.string().min(8, 'Please enter a valid phone number'),
  
  farm_name: z.string().optional(),
  province: z.string().optional(),
  farming_practice: z.string().optional(),
  bio: z.string().optional(),

  business_name: z.string().optional(),
  business_type: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'FARMER') {
    if (!data.farm_name || data.farm_name.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['farm_name'],
        message: 'Farm name is required (min 3 characters).',
      });
    }
  }
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'FARMER'>('CUSTOMER');
  const [serverError, setServerError] = useState<string | null>(null);

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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'CUSTOMER',
      email: '',
      username: '',
      password: '',
      phone_number: '',
      farm_name: '',
      province: 'Siem Reap',
      farming_practice: 'ORGANIC',
      business_type: 'INDIVIDUAL',
    },
  });

  const handleRoleChange = (role: 'CUSTOMER' | 'FARMER') => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      const user = await authRegister(data);
      if (user.role === 'FARMER') {
        navigate('/farmer/dashboard', { replace: true });
      } else {
        navigate('/products', { replace: true });
      }
    } catch (err: any) {
      if (err.response?.data) {
        const data = err.response.data;
        if (data.errors && typeof data.errors === 'object') {
          const messages = Object.entries(data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
          setServerError(messages.join(' | '));
        } else if (data.message) {
          setServerError(data.message);
        } else if (data.detail) {
          setServerError(data.detail);
        } else if (typeof data === 'object') {
          const messages = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
          setServerError(messages.join(' | '));
        } else {
          setServerError(String(data));
        }
      } else {
        setServerError('Network error. Please check your connection or CORS settings.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-soft">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest-600 text-white shadow-sm mb-2">
            <Sprout className="w-7 h-7 stroke-[2.2]" />
          </Link>
          <h2 className="text-2xl font-extrabold text-stone-900 font-display">
            Join FarmerDirect
          </h2>
          <p className="text-xs text-stone-500">
            Choose your account type to buy or sell fresh agricultural produce.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-stone-100 rounded-2xl">
          <button
            type="button"
            onClick={() => handleRoleChange('CUSTOMER')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'CUSTOMER'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-forest-600" />
            <span>Buyer / Restaurant</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('FARMER')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'FARMER'
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Sprout className="w-4 h-4 text-forest-600" />
            <span>Farmer / Grower</span>
          </button>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Username"
              placeholder="e.g. sokhavanna"
              leftIcon={<UserIcon className="w-4 h-4" />}
              error={errors.username?.message}
              {...register('username')}
            />

            <Input
              label="Phone Number"
              placeholder="+855 12 345 678"
              leftIcon={<Phone className="w-4 h-4" />}
              error={errors.phone_number?.message}
              {...register('phone_number')}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="your.email@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Conditional Farmer Fields */}
          {selectedRole === 'FARMER' && (
            <div className="pt-4 border-t border-stone-100 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-forest-800 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-forest-600" />
                <span>Farm & Agriculture Details</span>
              </div>

              <Input
                label="Farm Name"
                placeholder="e.g. Battambang Green Valley"
                error={errors.farm_name?.message}
                {...register('farm_name')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
                    Province / City
                  </label>
                  <select
                    {...register('province')}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
                  >
                    {provinces.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
                    Farming Practice
                  </label>
                  <select
                    {...register('farming_practice')}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
                  >
                    <option value="ORGANIC">Certified Organic / Natural</option>
                    <option value="REGENERATIVE">Regenerative Agriculture</option>
                    <option value="HYDROPONIC">Hydroponic Greenhouse</option>
                    <option value="PERMACULTURE">Permaculture</option>
                    <option value="CONVENTIONAL">Sustainable Conventional</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Customer Fields */}
          {selectedRole === 'CUSTOMER' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Business / Org (Optional)"
                placeholder="e.g. Haven Cafe"
                {...register('business_name')}
              />

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
                  Buyer Type
                </label>
                <select
                  {...register('business_type')}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
                >
                  <option value="INDIVIDUAL">Individual Consumer</option>
                  <option value="RESTAURANT">Restaurant / Cafe</option>
                  <option value="HOTEL">Hotel / Resort</option>
                  <option value="LOCAL_STORE">Local Grocery Store</option>
                </select>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full rounded-2xl mt-4"
            isLoading={isSubmitting}
          >
            Create {selectedRole === 'FARMER' ? 'Farmer' : 'Customer'} Account
          </Button>
        </form>

        <div className="text-center text-xs text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-forest-700 hover:text-forest-800">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

