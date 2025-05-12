import axios from 'axios';

export async function getDTDCRates({ pickupPincode, deliveryPincode, weight, cod }) {
  // TODO: Replace with actual DTDC API call
  // Example placeholder response
  return [
    {
      courier: 'DTDC',
      mode: 'surface',
      service: 'standard',
      rate: 110, // placeholder
      estimatedDelivery: '3-6 days',
      codCharge: cod ? 27 : 0,
      available: true
    }
  ];
}

// Booking function for centralized booking
export async function bookDTDCOrder(order) {
  // TODO: Integrate with DTDC API for real AWB, label, tracking
  return {
    awb: `DTDC${Date.now()}`,
    label: 'mock-dtdc-label-base64',
    trackingUrl: `https://dtdc.com/track/${order._id}`,
    courierName: 'DTDC'
  };
} 