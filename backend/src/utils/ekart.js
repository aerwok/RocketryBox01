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