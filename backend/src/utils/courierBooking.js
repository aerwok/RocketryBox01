import { bookDelhiveryOrder } from './delhivery.js';
import { bookBluedartOrder } from './bluedart.js';
import { bookXpressbeesOrder } from './xpressbees.js';
import { bookEkartOrder } from './ekart.js';
import { bookDTDCOrder } from './dtdc.js';

// Placeholder for booking an order with a courier partner
// Replace with real API logic for each courier

// Centralized booking function
export async function bookOrderWithCourier(order, courier) {
  switch (courier.toLowerCase()) {
    case 'delhivery':
      return await bookDelhiveryOrder(order);
    case 'bluedart':
      return await bookBluedartOrder(order);
    case 'xpressbees':
      return await bookXpressbeesOrder(order);
    case 'ekart':
      return await bookEkartOrder(order);
    case 'dtdc':
      return await bookDTDCOrder(order);
    default:
      // Fallback to mock data
      return {
        awb: `MOCKAWB${Date.now()}`,
        label: 'mock-label-base64', // In production, this should be a real PDF base64 string
        trackingUrl: `https://tracking.mockcourier.com/${order._id}`,
        courierName: courier
      };
  }
} 