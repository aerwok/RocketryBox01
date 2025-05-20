// Types for tracking data
export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description?: string;
}

export interface TrackingInfo {
  awbNumber: string;
  currentStatus: string;
  expectedDelivery: string;
  origin: string;
  destination: string;
  courier: string;
  events: TrackingEvent[];
}

// Dummy tracking data for development
const dummyTrackingData: { [key: string]: TrackingInfo } = {
  '1234567890': {
    awbNumber: '1234567890',
    currentStatus: 'In Transit',
    expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    origin: 'Mumbai, Maharashtra',
    destination: 'Bangalore, Karnataka',
    courier: 'RocketryBox Express',
    events: [
      {
        status: 'In Transit',
        location: 'Hyderabad, Telangana',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleString(),
        description: 'Shipment departed from transit facility'
      },
      {
        status: 'In Transit',
        location: 'Pune, Maharashtra',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
        description: 'Shipment arrived at transit facility'
      },
      {
        status: 'Shipped',
        location: 'Mumbai, Maharashtra',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString(),
        description: 'Shipment picked up from sender'
      }
    ]
  },
  '9876543210': {
    awbNumber: '9876543210',
    currentStatus: 'Delivered',
    expectedDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    origin: 'Delhi, Delhi',
    destination: 'Jaipur, Rajasthan',
    courier: 'RocketryBox Premium',
    events: [
      {
        status: 'Delivered',
        location: 'Jaipur, Rajasthan',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleString(),
        description: 'Package delivered to recipient'
      },
      {
        status: 'Out for Delivery',
        location: 'Jaipur, Rajasthan',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleString(),
        description: 'Package is out for delivery'
      },
      {
        status: 'In Transit',
        location: 'Gurugram, Haryana',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
        description: 'Shipment in transit to destination'
      },
      {
        status: 'Shipped',
        location: 'Delhi, Delhi',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString(),
        description: 'Shipment picked up from sender'
      }
    ]
  },
  '5678901234': {
    awbNumber: '5678901234',
    currentStatus: 'Out for Delivery',
    expectedDelivery: new Date(Date.now()).toLocaleDateString(),
    origin: 'Chennai, Tamil Nadu',
    destination: 'Coimbatore, Tamil Nadu',
    courier: 'RocketryBox Standard',
    events: [
      {
        status: 'Out for Delivery',
        location: 'Coimbatore, Tamil Nadu',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString(),
        description: 'Package is out for delivery'
      },
      {
        status: 'In Transit',
        location: 'Salem, Tamil Nadu',
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toLocaleString(),
        description: 'Shipment in transit to destination'
      },
      {
        status: 'Shipped',
        location: 'Chennai, Tamil Nadu',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toLocaleString(),
        description: 'Shipment picked up from sender'
      }
    ]
  }
};

/**
 * Generate a random tracking result for unknown AWB numbers
 */
const generateRandomTrackingInfo = (awbNumber: string): TrackingInfo => {
  // Random list of cities
  const cities = [
    { name: 'Mumbai', state: 'Maharashtra' },
    { name: 'Delhi', state: 'Delhi' },
    { name: 'Bangalore', state: 'Karnataka' },
    { name: 'Hyderabad', state: 'Telangana' },
    { name: 'Chennai', state: 'Tamil Nadu' },
    { name: 'Kolkata', state: 'West Bengal' },
    { name: 'Ahmedabad', state: 'Gujarat' },
    { name: 'Pune', state: 'Maharashtra' },
    { name: 'Jaipur', state: 'Rajasthan' },
    { name: 'Lucknow', state: 'Uttar Pradesh' }
  ];

  // Randomly select origin and destination
  const originIndex = Math.floor(Math.random() * cities.length);
  let destIndex = Math.floor(Math.random() * cities.length);
  while (destIndex === originIndex) {
    destIndex = Math.floor(Math.random() * cities.length);
  }

  const origin = cities[originIndex];
  const destination = cities[destIndex];

  // Random intermediate points
  const getRandomCity = () => {
    const index = Math.floor(Math.random() * cities.length);
    return cities[index];
  };

  // Generate tracking events
  const now = Date.now();
  const events = [
    {
      status: 'Shipped',
      location: `${origin.name}, ${origin.state}`,
      timestamp: new Date(now - 48 * 60 * 60 * 1000).toLocaleString(),
      description: 'Shipment picked up from sender'
    }
  ];

  // Add 1-3 intermediate points
  const transitPoints = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < transitPoints; i++) {
    const city = getRandomCity();
    events.unshift({
      status: 'In Transit',
      location: `${city.name}, ${city.state}`,
      timestamp: new Date(now - (24 - i * 8) * 60 * 60 * 1000).toLocaleString(),
      description: 'Shipment in transit to destination'
    });
  }

  return {
    awbNumber,
    currentStatus: 'In Transit',
    expectedDelivery: new Date(now + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    origin: `${origin.name}, ${origin.state}`,
    destination: `${destination.name}, ${destination.state}`,
    courier: 'RocketryBox Express',
    events
  };
};

/**
 * Fetch tracking information for an AWB number.
 * In a real application, this would make an API call to a backend service.
 */
export const fetchTrackingInfo = async (awbNumber: string): Promise<TrackingInfo> => {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validate AWB format
    if (!awbNumber || !/^\d{10}$/.test(awbNumber)) {
      throw new Error('Invalid AWB number. Please provide a 10-digit AWB number.');
    }

    // In a real app, this would be:
    // const response = await fetch(`/api/tracking/${awbNumber}`);
    // if (!response.ok) throw new Error('Failed to fetch tracking info');
    // return await response.json();
    
    // Get tracking info from dummy data or generate random
    return dummyTrackingData[awbNumber] || generateRandomTrackingInfo(awbNumber);
  } catch (error) {
    console.error('Error fetching tracking info:', error);
    throw error;
  }
}; 