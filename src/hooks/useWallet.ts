import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'credit' | 'debit' | 'refund' | 'promotional' | 'cashback';
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  balance_after: number;
  created_by: string | null;
  created_at: string;
}

export function useWallet() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [storeCredit, setStoreCredit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data as WalletTransaction[]);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('wallet_balance, store_credit')
        .eq('id', uid)
        .maybeSingle();

      if (error) throw error;
      setBalance(data?.wallet_balance ?? 0);
      setStoreCredit(data?.store_credit ?? 0);
    } catch (err: any) {
      console.error('Error fetching balance:', err);
      // Set defaults on error
      setBalance(0);
      setStoreCredit(0);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        fetchTransactions(uid);
        fetchBalance(uid);
      } else {
        setTransactions([]);
        setBalance(0);
        setStoreCredit(0);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        fetchTransactions(uid);
        fetchBalance(uid);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchTransactions, fetchBalance]);

  const getTransactionsByType = (type: WalletTransaction['transaction_type']) => {
    return transactions.filter(t => t.transaction_type === type);
  };

  const getRefunds = () => getTransactionsByType('refund');
  const getCashbacks = () => getTransactionsByType('cashback');
  const getPromotionalCredits = () => getTransactionsByType('promotional');

  const getTotalCredits = () => {
    return transactions
      .filter(t => ['credit', 'refund', 'promotional', 'cashback'].includes(t.transaction_type))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalDebits = () => {
    return transactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  return {
    transactions,
    balance,
    storeCredit,
    totalBalance: balance + storeCredit,
    loading,
    getTransactionsByType,
    getRefunds,
    getCashbacks,
    getPromotionalCredits,
    getTotalCredits,
    getTotalDebits,
    refetch: () => {
      if (userId) {
        fetchTransactions(userId);
        fetchBalance(userId);
      }
    }
  };
}
