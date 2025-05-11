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