import axios from 'axios';

export async function getDelhiveryRates({ pickupPincode, deliveryPincode, weight, cod }) {
  // TODO: Replace with actual Delhivery API call
  // Example placeholder response
  return [
    {
      courier: 'Delhivery',
      mode: 'surface',
      service: 'standard',
      rate: 120, // placeholder
      estimatedDelivery: '3-5 days',
      codCharge: cod ? 35 : 0,
      available: true
    }
  ];
} 