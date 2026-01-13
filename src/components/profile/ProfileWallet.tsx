import { useWallet, WalletTransaction } from "@/hooks/useWallet";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Gift, 
  RotateCcw,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";

const transactionConfig: Record<WalletTransaction['transaction_type'], { 
  icon: React.ReactNode; 
  color: string; 
  label: string 
}> = {
  credit: { icon: <ArrowUpCircle className="w-4 h-4" />, color: "text-green-500", label: "Credit" },
  debit: { icon: <ArrowDownCircle className="w-4 h-4" />, color: "text-red-500", label: "Debit" },
  refund: { icon: <RotateCcw className="w-4 h-4" />, color: "text-blue-500", label: "Refund" },
  promotional: { icon: <Gift className="w-4 h-4" />, color: "text-purple-500", label: "Promotional" },
  cashback: { icon: <Sparkles className="w-4 h-4" />, color: "text-gold", label: "Cashback" }
};

export function ProfileWallet() {
  const { profile } = useUserProfile();
  const { transactions, balance, storeCredit, totalBalance, loading, getTotalCredits, getTotalDebits } = useWallet();

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">৳{totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available to use</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gold/20 to-gold/10 border-gold/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">৳{balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Refunds & cashback</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-500" />
              Store Credit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">৳{storeCredit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Promotional credits</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-xl font-bold text-green-500">৳{getTotalCredits().toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-500/10">
              <ArrowDownCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Used</p>
              <p className="text-xl font-bold text-red-500">৳{getTotalDebits().toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-8 text-center">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(transaction => {
                const config = transactionConfig[transaction.transaction_type];
                const isPositive = ['credit', 'refund', 'promotional', 'cashback'].includes(transaction.transaction_type);

                return (
                  <div 
                    key={transaction.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full bg-muted ${config.color}`}>
                      {config.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {transaction.description || config.label}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : '-'}৳{Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance: ৳{transaction.balance_after.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
