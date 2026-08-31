import React, { useState } from 'react';
import { Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { inquiriesApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmerId?: string;
  farmName?: string;
  productId?: string;
  productName?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  farmerId,
  farmName,
  productId,
  productName,
}) => {
  const { isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setIsSending(true);
      await inquiriesApi.startConversation({
        farmer_id: farmerId,
        product_id: productId,
        message: message.trim(),
        subject: productName ? `Inquiry regarding ${productName}` : `Inquiry for ${farmName}`,
      });
      setSentSuccess(true);
      setMessage('');
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productName ? `Inquire About ${productName}` : `Message ${farmName}`}
    >
      {!isAuthenticated ? (
        <div className="py-6 text-center space-y-3">
          <MessageSquare className="w-8 h-8 text-forest-600 mx-auto" />
          <h3 className="text-sm font-bold text-stone-900">Sign in to message the grower</h3>
          <p className="text-xs text-stone-500">
            Please log in to communicate directly with local farmers and restaurants.
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="primary" size="sm">Sign In / Register</Button>
            </Link>
          </div>
        </div>
      ) : sentSuccess ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-forest-100 text-forest-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Inquiry Sent!</h3>
          <p className="text-xs text-stone-500">
            {farmName || 'The grower'} has received your message and will respond in your inbox.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-stone-500">
            Ask {farmName || 'the grower'} about wholesale availability, harvest ripeness, delivery scheduling, or special packaging.
          </p>

          <div>
            <textarea
              rows={4}
              placeholder="e.g. Hello! We are a restaurant in Siem Reap looking for 40kg weekly deliveries..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs text-stone-900 focus:outline-none focus:border-forest-600"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSending}
              disabled={!message.trim() || isSending}
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send Message
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

