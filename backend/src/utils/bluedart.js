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

// Booking function for centralized booking
export async function bookBluedartOrder(order) {
  try {
    const payload = {
      ConsigneeName: order.customer.name,
      ConsigneeAddress: order.customer.address.street,
      ConsigneePhone: order.customer.phone,
      // Add other required fields as per Blue Dart API documentation
      UserName: process.env.BLUEDART_USER,
      LicenseKey: process.env.BLUEDART_LICENSE_KEY,
      Version: process.env.BLUEDART_VERSION,
      Api_type: process.env.BLUEDART_API_TYPE
    };

    const response = await axios.post(
      process.env.BLUEDART_API_URL,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Parse the response as per Blue Dart API docs
    return {
      awb: response.data.AWBNumber || `BLUEDART${Date.now()}`,
      label: response.data.LabelPDF || 'mock-bluedart-label-base64',
      trackingUrl: `https://bluedart.com/track/${response.data.AWBNumber || `BLUEDART${Date.now()}`}`,
      courierName: 'Bluedart'
    };
  } catch (error) {
    // Fallback to mock if API fails
    return {
      awb: `BLUEDART${Date.now()}`,
      label: 'mock-bluedart-label-base64',
      trackingUrl: `https://bluedart.com/track/BLUEDART${Date.now()}`,
      courierName: 'Bluedart',
      error: error.message
    };
  }
} 