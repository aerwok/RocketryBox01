import { useNavigate } from 'react-router-dom';
import {
    AddressSection,
    OrderSummarySection,
    PaymentOptionsSection,
    PriceDetailsSection,
    PayButton,
    LoadingSpinner,
    ErrorDisplay
} from '../../components/PaymentComponents';
import { useOrderData } from '../../hooks/useOrderData';
import { usePayment } from '../../hooks/usePayment';
import { PaymentMethod } from '../../constants/payment';

const PaymentPage = () => {
    const { orderData, isLoading, error } = useOrderData();
    const { 
        selectedPayment, 
        setSelectedPayment, 
        isProcessing, 
        priceDetails, 
        total, 
        initializePayment 
    } = usePayment(orderData);
    const navigate = useNavigate();

    if (isLoading) return <LoadingSpinner />;
    if (error || !orderData) return <ErrorDisplay error={error || "Failed to load order details"} />;

    const handleChangeAddress = () => {
        navigate('/customer/create-order', { 
            state: { 
                editMode: 'address',
                orderId: orderData._id 
            } 
        });
    };

    const handleChangeOrder = () => {
        navigate('/customer/create-order', { 
            state: { 
                editMode: 'order',
                orderId: orderData._id 
            } 
        });
    };

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-xl font-medium mb-4 text-center">PAYMENT</h1>
            <div className="max-w-3xl mx-auto grid grid-cols-1 gap-4">
                <div className="space-y-4">
                    <AddressSection 
                        orderData={orderData} 
                        onChangeClick={handleChangeAddress} 
                    />
                    
                    <OrderSummarySection 
                        orderData={orderData} 
                        onChangeClick={handleChangeOrder} 
                    />
                    
                    <PaymentOptionsSection 
                        selectedPayment={selectedPayment}
                        onPaymentChange={(value: PaymentMethod | '') => setSelectedPayment(value)}
                    />
                </div>

                <PriceDetailsSection 
                    priceDetails={priceDetails}
                    total={total}
                />

                <PayButton 
                    isProcessing={isProcessing}
                    disabled={!selectedPayment || isProcessing}
                    onClick={initializePayment}
                />
            </div>
        </div>
    );
};

export default PaymentPage; 