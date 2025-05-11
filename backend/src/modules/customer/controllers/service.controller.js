import { AppError } from '../../../middleware/errorHandler.js';
import { calculateShippingRates, getServiceAvailability } from '../../../utils/shipping.js';

// List available services
export const listServices = async (req, res, next) => {
  try {
    const services = [
      {
        id: 'standard',
        name: 'Standard Delivery',
        description: 'Regular delivery service with 3-5 business days delivery time',
        type: 'standard',
        price: 100,
        estimatedDelivery: '3-5 business days',
        features: [
          'Free pickup',
          'Online tracking',
          'SMS updates',
          'Email notifications'
        ]
      },
      {
        id: 'express',
        name: 'Express Delivery',
        description: 'Fast delivery service with 1-2 business days delivery time',
        type: 'express',
        price: 200,
        estimatedDelivery: '1-2 business days',
        features: [
          'Free pickup',
          'Priority handling',
          'Real-time tracking',
          'SMS updates',
          'Email notifications'
        ]
      },
      {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay when you receive your package',
        type: 'cod',
        price: 150,
        estimatedDelivery: '3-5 business days',
        features: [
          'Free pickup',
          'Online tracking',
          'SMS updates',
          'Email notifications',
          'Cash on delivery'
        ]
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        services
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Check service availability
export const checkAvailability = async (req, res, next) => {
  try {
    const { pickupPincode, deliveryPincode, package: packageDetails } = req.body;

    // Check if service is available for the given pincodes
    const availability = await getServiceAvailability(pickupPincode, deliveryPincode);

    if (!availability.available) {
      return res.status(200).json({
        success: true,
        data: {
          available: false,
          message: availability.message
        }
      });
    }

    // Calculate shipping rates for each service type
    const rates = await Promise.all([
      calculateShippingRates({
        weight: packageDetails.weight,
        dimensions: packageDetails.dimensions,
        pickupPincode,
        deliveryPincode,
        serviceType: 'standard'
      }),
      calculateShippingRates({
        weight: packageDetails.weight,
        dimensions: packageDetails.dimensions,
        pickupPincode,
        deliveryPincode,
        serviceType: 'express'
      }),
      calculateShippingRates({
        weight: packageDetails.weight,
        dimensions: packageDetails.dimensions,
        pickupPincode,
        deliveryPincode,
        serviceType: 'cod'
      })
    ]);

    const services = [
      {
        id: 'standard',
        name: 'Standard Delivery',
        price: rates[0].totalRate,
        estimatedDelivery: rates[0].estimatedDelivery
      },
      {
        id: 'express',
        name: 'Express Delivery',
        price: rates[1].totalRate,
        estimatedDelivery: rates[1].estimatedDelivery
      },
      {
        id: 'cod',
        name: 'Cash on Delivery',
        price: rates[2].totalRate,
        estimatedDelivery: rates[2].estimatedDelivery
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        available: true,
        services
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
}; 