import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatAddress, formatDate, formatCurrency } from "@/lib/utils";
import { OrderData, PriceDetail } from "../types/order";
import { PAYMENT_METHODS, PaymentMethod } from "../constants/payment";

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

export const Section = ({ title, children }: SectionProps) => (
    <div className="bg-[#0070BA] text-white p-4 rounded">
        <p className="text-sm mb-3">{title}</p>
        {children}
    </div>
);

interface AddressSectionProps {
    orderData: OrderData;
    onChangeClick: () => void;
}

export const AddressSection = ({ orderData, onChangeClick }: AddressSectionProps) => (
    <div className="bg-[#0070BA] text-white p-4 rounded flex justify-between items-start">
        <div>
            <p className="text-sm mb-2">Delivery Address</p>
            <p className="text-sm">{orderData.receiverName}</p>
            <p className="text-sm">{formatAddress([
                orderData.receiverAddress1,
                orderData.receiverAddress2,
                orderData.receiverCity,
                orderData.receiverState,
                orderData.receiverPincode
            ])}</p>
        </div>
        <ChangeButton onClick={onChangeClick} />
    </div>
);

interface OrderSummarySectionProps {
    orderData: OrderData;
    onChangeClick: () => void;
}

export const OrderSummarySection = ({ orderData, onChangeClick }: OrderSummarySectionProps) => (
    <div className="bg-[#0070BA] text-white p-4 rounded flex justify-between items-start">
        <div>
            <p className="text-sm mb-2">Order Summary</p>
            <p className="text-sm">
                {orderData.length}×{orderData.width}×{orderData.height} cm, {orderData.packageType}, 
                Pickup: {formatDate(orderData.pickupDate)}
            </p>
        </div>
        <ChangeButton onClick={onChangeClick} />
    </div>
);

interface PaymentOptionsSectionProps {
    selectedPayment: PaymentMethod | '';
    onPaymentChange: (value: PaymentMethod | '') => void;
}

export const PaymentOptionsSection = ({ selectedPayment, onPaymentChange }: PaymentOptionsSectionProps) => (
    <Section title="Payment Options">
        <RadioGroup 
            value={selectedPayment} 
            onValueChange={onPaymentChange}
            className="space-y-3"
        >
            {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={value} className="border-white text-white" />
                    <Label htmlFor={value} className="text-sm text-white cursor-pointer">
                        {key === 'UPI' ? 'UPI' : 
                         key === 'CARD' ? 'Credit / Debit / ATM Card' : 
                         'Net Banking'}
                    </Label>
                </div>
            ))}
        </RadioGroup>
    </Section>
);

interface PriceDetailsSectionProps {
    priceDetails: PriceDetail[];
    total: number;
}

export const PriceDetailsSection = ({ priceDetails, total }: PriceDetailsSectionProps) => (
    <Section title="Price Details">
        <div className="space-y-2 text-sm">
            {priceDetails.map((item) => (
                <div key={item.label} className="flex justify-between">
                    <span>{item.label}</span>
                    <span>{item.value ? formatCurrency(item.value) : '-'}</span>
                </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-white/20 mt-2">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
            </div>
        </div>
    </Section>
);

interface PayButtonProps {
    isProcessing: boolean;
    disabled: boolean;
    onClick: () => void;
}

export const PayButton = ({ isProcessing, disabled, onClick }: PayButtonProps) => (
    <Button 
        className="w-full bg-[#0070BA] hover:bg-[#0070BA]/90 text-white"
        size="sm"
        disabled={disabled}
        onClick={onClick}
    >
        {isProcessing ? (
            <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
            </span>
        ) : (
            'Pay'
        )}
    </Button>
);

interface ChangeButtonProps {
    onClick: () => void;
}

export const ChangeButton = ({ onClick }: ChangeButtonProps) => (
    <button 
        className="text-xs bg-transparent border border-white px-2 py-1 rounded"
        onClick={onClick}
    >
        Change
    </button>
);

export const LoadingSpinner = () => (
    <div className="container mx-auto py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0070BA]" />
        <span className="ml-2 text-gray-600">Loading order details...</span>
    </div>
);

interface ErrorDisplayProps {
    error: string;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => (
    <div className="container mx-auto py-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button 
            onClick={() => window.location.href = '/customer/create-order'}
            className="mt-4"
        >
            Return to Create Order
        </Button>
    </div>
); 