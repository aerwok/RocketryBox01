import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { XIcon, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { validateAmount, ERROR_MESSAGES } from "@/utils/validation";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = "balance" | "recharge" | "history";

const QUICK_RECHARGE_OPTIONS = [500, 1000, 5000, 10000];

const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
    const [activeTab, setActiveTab] = useState<TabType>("balance");
    const [rechargeAmount, setRechargeAmount] = useState<string>("5000");
    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const {
        walletBalance,
        isLoadingBalance,
        isRecharging,
        transactions,
        isLoadingTransactions,
        hasMoreTransactions,
        rechargeWallet,
        loadMoreTransactions,
        refreshTransactions
    } = useWallet();

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setRechargeAmount("5000");
            setPaymentMethod("");
            setActiveTab("balance");
        }
    }, [isOpen]);

    const handleRecharge = async () => {
        try {
            const amount = Number(rechargeAmount);
            
            // Validate amount
            if (!validateAmount(amount)) {
                toast.error(ERROR_MESSAGES.INVALID_AMOUNT);
                return;
            }

            // Validate payment method
            if (!paymentMethod) {
                toast.error("Please select a payment method");
                return;
            }

            await rechargeWallet({ amount, paymentMethod });
            onClose();
        } catch (error) {
            console.error("Recharge error:", error);
            // Error is already handled in the hook
        }
    };

    const handleAmountChange = (value: string) => {
        // Only allow numbers and limit length
        if (/^\d*$/.test(value) && value.length <= 6) {
            setRechargeAmount(value);
        }
    };

    const getAvailableBalance = () => {
        return paymentMethod === "remittance" ? walletBalance?.remittanceBalance || 0 : 0;
    };

    const renderBalance = () => {
        if (isLoadingBalance) {
            return <Loader2 className="h-4 w-4 animate-spin" />;
        }
        return formatCurrency(walletBalance?.walletBalance || 0);
    };

    const renderTransactions = () => {
        if (isLoadingTransactions && transactions.length === 0) {
            return (
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            );
        }

        if (transactions.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-8">
                    No transactions found
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {transactions.map((transaction) => (
                    <div
                        key={transaction.transactionId}
                        className="flex items-center justify-between p-4 rounded-lg border"
                    >
                        <div>
                            <div className="font-medium">
                                {transaction.type === "Credit" ? "Recharge" : "Withdrawal"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={cn(
                                "font-medium",
                                transaction.type === "Credit" ? "text-green-600" : "text-red-600"
                            )}>
                                {transaction.type === "Credit" ? "+" : "-"}
                                {formatCurrency(transaction.amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Balance: {formatCurrency(transaction.balance)}
                            </div>
                        </div>
                    </div>
                ))}
                {hasMoreTransactions && (
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={loadMoreTransactions}
                        disabled={isLoadingTransactions}
                    >
                        {isLoadingTransactions ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load More"
                        )}
                    </Button>
                )}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-md p-0 overflow-hidden border-none">
                <DialogHeader className="px-6 pt-10 relative">
                    <DialogClose className="absolute right-6 top-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <XIcon className="h-4 w-4" />
                    </DialogClose>
                    <div className="flex w-full p-1 gap-2">
                        <button
                            className={cn(
                                "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                activeTab === "balance"
                                    ? "bg-primary text-white"
                                    : "hover:bg-gray-100/10"
                            )}
                            onClick={() => setActiveTab("balance")}
                        >
                            Balance
                        </button>
                        <button
                            className={cn(
                                "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                activeTab === "recharge"
                                    ? "bg-primary text-white"
                                    : "hover:bg-gray-100/10"
                            )}
                            onClick={() => setActiveTab("recharge")}
                        >
                            Recharge
                        </button>
                        <button
                            className={cn(
                                "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                activeTab === "history"
                                    ? "bg-primary text-white"
                                    : "hover:bg-gray-100/10"
                            )}
                            onClick={() => setActiveTab("history")}
                        >
                            History
                        </button>
                    </div>
                </DialogHeader>

                <div className="p-6 pt-0 px-7 h-[240px] lg:h-[260px] overflow-y-auto">
                    {activeTab === "balance" ? (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg">
                                        Wallet Balance
                                    </span>
                                    <span className="text-lg font-semibold">
                                        {renderBalance()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg">
                                        Last Recharge
                                    </span>
                                    <span className="text-lg font-semibold">
                                        {formatCurrency(walletBalance?.lastRecharge || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg">
                                        Remittance/COD Balance
                                    </span>
                                    <span className="text-lg font-semibold">
                                        {formatCurrency(walletBalance?.remittanceBalance || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === "recharge" ? (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-lg">
                                        Amount
                                    </label>
                                    <Input
                                        type="text"
                                        value={rechargeAmount}
                                        onChange={(e) => handleAmountChange(e.target.value)}
                                        className="mt-2"
                                        placeholder="Enter amount"
                                        maxLength={6}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_RECHARGE_OPTIONS.map((amount) => (
                                        <Button
                                            key={amount}
                                            variant="outline"
                                            onClick={() => handleAmountChange(amount.toString())}
                                            className="flex-1 text-black"
                                        >
                                            +{amount}
                                        </Button>
                                    ))}
                                </div>
                                <div className="w-full">
                                    <Select onValueChange={setPaymentMethod}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="remittance">
                                                Remittance/COD
                                            </SelectItem>
                                            <SelectItem value="onlineBanking">
                                                Online Banking
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {paymentMethod === "remittance" && (
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>Available Balance:</span>
                                        <span className="font-medium">{formatCurrency(getAvailableBalance())}</span>
                                    </div>
                                )}
                                <Button
                                    className="w-full"
                                    onClick={handleRecharge}
                                    disabled={isRecharging || !paymentMethod || (paymentMethod === "remittance" && Number(rechargeAmount) > getAvailableBalance())}
                                >
                                    {isRecharging ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Recharge"
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Transaction History</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={refreshTransactions}
                                    disabled={isLoadingTransactions}
                                >
                                    <RefreshCw className={cn(
                                        "h-4 w-4",
                                        isLoadingTransactions && "animate-spin"
                                    )} />
                                </Button>
                            </div>
                            {renderTransactions()}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WalletModal; 