interface Payment {
    id: string;
    paymentId: string;
    amount: number;
    status: string;
    date: string;
}

const PAYMENTS_DATA: Payment[] = []; 