import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Lock,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { paymentsApi } from '../../api';

interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  totalAmountUSD: string;
  onPaymentSuccess: () => void;
}

export const CardPaymentModal: React.FC<CardPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  totalAmountUSD,
  onPaymentSuccess,
}) => {
  const [cardName, setCardName] = useState('Touch Theara');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('888');

  const [step, setStep] = useState<'card_input' | 'otp_verify' | 'success'>('card_input');
  const [otp, setOtp] = useState('782910');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('otp_verify');
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      await paymentsApi.simulateSuccess(orderId);
      setStep('success');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'otp_verify'
          ? '3D Secure Bank Verification'
          : 'Secure Card Checkout (Escrow Protected)'
      }
      maxWidth="md"
    >
      {step === 'success' ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-forest-100 text-forest-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-extrabold text-stone-900 font-display">Card Payment Authorized!</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            ${totalAmountUSD} for Order #{orderNumber} was securely placed into farmer escrow. Your invoice has been generated.
          </p>
        </div>
      ) : step === 'otp_verify' ? (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1 text-center">
            <div className="inline-flex p-2 rounded-full bg-emerald-100 text-emerald-800 mb-1">
              <KeyRound className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm">One-Time Password (OTP)</h4>
            <p className="text-stone-600 text-[11px]">
              We sent a 6-digit security code to your registered mobile number ending in <strong className="text-stone-900">•••• 678</strong>.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider text-center">
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center tracking-[0.5em] font-mono text-2xl font-extrabold bg-stone-50 border border-stone-300 rounded-2xl py-3 text-stone-900 focus:outline-none focus:border-forest-600"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="ghost" onClick={() => setStep('card_input')}>
              Back
            </Button>
            <Button type="submit" variant="primary" isLoading={isProcessing} className="w-full sm:w-auto">
              Verify & Complete Payment (${totalAmountUSD})
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleCardSubmit} className="space-y-4">
          <div className="p-3.5 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-stone-400">FARMERDIRECT ESCROW CARD</span>
              <span className="font-bold text-amber-400">VISA / MASTERCARD</span>
            </div>
            <div className="font-mono text-base font-bold tracking-wider py-1">
              {cardNumber}
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-stone-300">
              <span>{cardName.toUpperCase()}</span>
              <span>EXP: {expiry}</span>
            </div>
          </div>

          <Input
            label="Cardholder Full Name"
            placeholder="e.g. Touch Theara"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            required
          />

          <Input
            label="Card Number"
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiry Date"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              required
            />
            <Input
              label="Security Code (CVV)"
              placeholder="CVC / CVV"
              type="password"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-[11px] text-stone-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>256-Bit SSL Encrypted. Payment held in escrow until order arrives.</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isProcessing} className="w-full sm:w-auto">
              Proceed to 3D Secure (${totalAmountUSD})
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

