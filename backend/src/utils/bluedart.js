import axios from 'axios';

export async function getBluedartRates({ pickupPincode, deliveryPincode, weight, cod }) {
  // TODO: Replace with actual Bluedart API call
  // Example placeholder response
  return [
    {
      courier: 'Bluedart',
      mode: 'air',
      service: 'express',
      rate: 150, // placeholder
      estimatedDelivery: '2-4 days',
      codCharge: cod ? 35 : 0,
      available: true
    }
  ];
} 