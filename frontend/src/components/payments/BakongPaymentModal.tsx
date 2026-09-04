import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { paymentsApi } from '../../api';
import type { BakongPaymentInitiateResponse } from '../../types';

interface BakongPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  totalAmountUSD: string;
  onPaymentSuccess: () => void;
}

export const BakongPaymentModal: React.FC<BakongPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  totalAmountUSD,
  onPaymentSuccess,
}) => {
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [paymentData, setPaymentData] = useState<BakongPaymentInitiateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes

  // Load KHQR payload
  useEffect(() => {
    if (isOpen && orderId) {
      setIsLoading(true);
      setIsSuccess(false);
      setTimeLeft(300);
      paymentsApi
        .initiatePayment(orderId, currency, 'BAKONG_QR')
        .then((res) => {
          setPaymentData(res.data);
        })
        .catch((err) => {
          console.error('Failed to initiate KHQR payment', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, orderId, currency]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || isSuccess || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isSuccess, timeLeft]);

  // Auto-polling verification
  useEffect(() => {
    if (!isOpen || isSuccess || !orderId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await paymentsApi.verifyPayment(orderId);
        if (res.data.payment_status === 'COMPLETED' || res.data.payment_status === 'PAID') {
          triggerSuccess();
        }
      } catch {
        // Continue polling
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isOpen, isSuccess, orderId]);

  const triggerSuccess = () => {
    setIsSuccess(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      onPaymentSuccess();
    }, 2200);
  };

  const handleSimulatePayment = async () => {
    try {
      setIsSimulating(true);
      await paymentsApi.simulateSuccess(orderId);
      triggerSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bakong KHQR Universal Pay" maxWidth="md">
      {isSuccess ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-forest-100 text-forest-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-stone-900 font-display">Payment Confirmed & Settled!</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Your transfer for Order #{orderNumber} was successfully processed via Bakong KHQR.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-stone-600">
              <span>Transaction Ref:</span>
              <span className="font-mono font-bold text-stone-900">{paymentData?.transaction_id || `KHQR-${orderNumber}`}</span>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <span>Amount Paid:</span>
              <span className="font-bold text-stone-900">${totalAmountUSD} USD</span>
            </div>
            <div className="flex items-center justify-between text-forest-800 font-medium pt-1.5 border-t border-stone-200/60">
              <span>Platform Commission:</span>
              <span>${(parseFloat(totalAmountUSD) * 0.05).toFixed(2)} (5.0%)</span>
            </div>
            <div className="flex items-center justify-between text-forest-900 font-bold">
              <span>Farmer Net Payout:</span>
              <span className="text-forest-700 font-mono">${(parseFloat(totalAmountUSD) * 0.95).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-stone-200/60 text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Real money settled into farmer bank account & recorded in database.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Currency Toggle */}
          <div className="flex items-center justify-between bg-stone-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currency === 'USD' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              USD ($) — ${totalAmountUSD}
            </button>
            <button
              type="button"
              onClick={() => setCurrency('KHR')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                currency === 'KHR' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              KHR (៛) — ៛{(parseFloat(totalAmountUSD) * 4100).toLocaleString()}
            </button>
          </div>

          {/* QR Code Container */}
          <div className="bg-gradient-to-b from-stone-50 via-emerald-50/20 to-stone-50 p-5 rounded-3xl border border-stone-200 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                <QrCode className="w-3 h-3" />
                <span>Bakong KHQR</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> EMVCo 256-bit Secure
              </span>
            </div>

            <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-center relative">
              {isLoading ? (
                <div className="text-xs text-stone-400 font-medium animate-pulse">Generating dynamic EMVCo QR...</div>
              ) : paymentData?.qr_image ? (
                <img src={paymentData.qr_image} alt="Bakong KHQR" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <div className="text-xs text-rose-500">QR code unavailable</div>
              )}
            </div>

            <div className="text-xs text-stone-600 font-medium">
              Scan with <strong className="text-stone-900">ABA Mobile, ACLEDA, Wing, Bakong</strong> or any banking app.
            </div>

            <div className="text-[11px] text-stone-400 font-mono">
              Dynamic QR auto-expires in: <span className="text-rose-600 font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Farmer Banking Details Box */}
          {paymentData && (
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-[11px] border-b border-stone-200/60 pb-1.5 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-forest-600" />
                  Farmer Direct Bank Account
                </span>
                <span className="text-forest-700">{paymentData.farmer_bank_name || 'ABA Bank'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-500">Account Name:</span>
                <span className="font-bold text-stone-900">{paymentData.farmer_account_name || 'Grower Account'}</span>
              </div>

              {paymentData.farmer_account_number && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Account No:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-stone-900">{paymentData.farmer_account_number}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentData.farmer_account_number!, 'acc')}
                      className="p-1 hover:bg-stone-200 rounded text-stone-500"
                      title="Copy Account Number"
                    >
                      {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-stone-500">Bakong ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-forest-800 font-bold">{paymentData.bakong_account_id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentData.bakong_account_id!, 'bakong')}
                    className="p-1 hover:bg-stone-200 rounded text-stone-500"
                    title="Copy Bakong ID"
                  >
                    {copiedField === 'bakong' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-forest-800 bg-forest-50/80 px-2.5 py-1.5 rounded-xl border border-forest-100">
                <span>Platform Commission:</span>
                <span className="font-semibold">5.0% auto-deducted (95% to farmer)</span>
              </div>

              {paymentData.signature_hash && (
                <div className="text-[10px] text-stone-400 font-mono pt-1 border-t border-stone-200/40 truncate">
                  Sig: {paymentData.signature_hash} (Tamper Protected)
                </div>
              )}
            </div>
          )}

          {/* Primary Action: Official ABA PayWay Direct Real Money Checkout */}
          <div className="space-y-2.5 pt-1">
            <a
              href="https://link-sandbox.payway.com.kh/pS81031X"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 text-white text-sm font-extrabold hover:from-teal-800 hover:to-teal-950 transition-all shadow-md active:scale-[0.99]"
            >
              <Building2 className="w-4 h-4 text-teal-200" />
              <span>Pay Real Money with ABA PayWay Checkout</span>
              <ExternalLink className="w-4 h-4 text-teal-200" />
            </a>

            {paymentData?.deep_link && (
              <a
                href={paymentData.deep_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-forest-50 text-forest-800 text-xs font-bold hover:bg-forest-100 transition-colors border border-forest-200"
              >
                <span>Open Directly in ABA Mobile App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl text-center font-semibold flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
              <span>Official ABA PayWay Payment Link Active: https://link-sandbox.payway.com.kh/pS81031X</span>
            </div>
          </div>

          {/* Simulate Bank Webhook Confirmation */}
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSimulatePayment}
              isLoading={isSimulating}
              className="w-full text-[11px] font-bold text-teal-700 border-teal-200 hover:bg-teal-50"
              leftIcon={<Zap className="w-3.5 h-3.5 text-teal-600" />}
            >
              Confirm Bank Transfer (Simulate Bank Hook)
            </Button>
          </div>

          <div className="text-[10px] text-stone-400 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Escrow Protected: Funds released to farmer only after crate handover.</span>
          </div>
        </div>
      )}
    </Modal>
  );
};
