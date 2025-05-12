import axios from 'axios';

export async function getEkartRates({ pickupPincode, deliveryPincode, weight, cod }) {
  // TODO: Replace with actual Ekart API call
  // Example placeholder response
  return [
    {
      courier: 'Ekart',
      mode: 'air',
      service: 'express',
      rate: 130, // placeholder
      estimatedDelivery: '2-5 days',
      codCharge: cod ? 30 : 0,
      available: true
    }
  ];
}

// Booking function for centralized booking
export async function bookEkartOrder(order) {
  // TODO: Integrate with Ekart API for real AWB, label, tracking
  return {
    awb: `EKART${Date.now()}`,
    label: 'mock-ekart-label-base64',
    trackingUrl: `https://ekartlogistics.com/track/${order._id}`,
    courierName: 'Ekart'
  };
} 