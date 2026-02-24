
import { useState, useEffect } from 'react';
import { User, Package, Transaction } from '../types';
import { DatabaseService } from '../services/dbService';

export const usePaymentLogic = (user: User | null) => {
  const db = DatabaseService.getInstance();
  const [packages, setPackages] = useState<Package[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [paymentStep, setPaymentStep] = useState<'methods' | 'form' | 'success' | 'idle'>('idle');
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Bkash' | 'Nagad' | 'Rocket' | null>(null);
  const [paymentForm, setPaymentForm] = useState({ trxId: '', screenshot: '', message: '' });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  useEffect(() => {
    db.getPackages().then(setPackages);
    if (user) db.getUserTransactions(user.id).then(setUserTransactions);
  }, [user]);

  const handlePaymentSubmit = async () => {
    if (!selectedPkg || !paymentMethod || !paymentForm.trxId || !user) {
      alert("সবগুলো তথ্য সঠিকভাবে পূরণ করুন।");
      return;
    }
    setPaymentSubmitting(true);
    try {
      const success = await db.submitPaymentRequest(
        user.id, selectedPkg.id, selectedPkg.price, 
        paymentMethod, paymentForm.trxId, 
        paymentForm.screenshot, paymentForm.message
      );
      if (success) {
        setPaymentStep('success');
        setPaymentForm({ trxId: '', screenshot: '', message: '' });
        db.getUserTransactions(user.id).then(setUserTransactions);
      }
    } catch (e: any) {
      alert(e.message || "Payment request failed.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleApprovePayment = async (txId: string) => {
    try {
      const tx = await db.updateTransactionStatus(txId, 'completed');
      const pkg = packages.find(p => p.id === tx.package_id);
      if (pkg) {
        await db.addUserTokens(tx.user_id, pkg.tokens);
        alert("Payment Approved! Tokens added.");
      }
    } catch (e: any) { alert(e.message); }
  };

  const handleRejectPayment = async (txId: string) => {
    try {
      await db.updateTransactionStatus(txId, 'rejected');
      alert("Payment Rejected.");
    } catch (e: any) { alert(e.message); }
  };

  return {
    packages, userTransactions, paymentStep, setPaymentStep,
    selectedPkg, setSelectedPkg, paymentMethod, setPaymentMethod,
    paymentForm, setPaymentForm, paymentSubmitting,
    handlePaymentSubmit, handleApprovePayment, handleRejectPayment,
    refreshTransactions: () => user && db.getUserTransactions(user.id).then(setUserTransactions)
  };
};
