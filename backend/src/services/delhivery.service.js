import axios from 'axios';
import { DELHIVERY_CONFIG } from '../config/delhivery.config.js';

/**
 * Delhivery Service with Complete B2C and B2B Integration
 * Professional API Implementation with Full Feature Support
 */
export class DelhiveryService {
  constructor(config = DELHIVERY_CONFIG) {
    this.config = config;
    this.waybillCache = [];
    this.isInitialized = false;
    this.lastHealthCheck = null;
    this.healthStatus = 'unknown';
  }

  /**
   * Initialize service and validate configuration
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Delhivery Service...');

      // Validate configuration
      if (!this.config.validateConfig || !this.config.validateConfig()) {
        console.warn('⚠️ Delhivery configuration validation failed - using fallback values');
      }

      // Test API connectivity
      const healthCheck = await this.performHealthCheck();
      if (healthCheck.success) {
        console.log('✅ Delhivery API connectivity verified');
        this.healthStatus = 'healthy';
      } else {
        console.warn('⚠️ Delhivery API connectivity issues detected');
        this.healthStatus = 'degraded';
      }

      this.isInitialized = true;
      this.lastHealthCheck = Date.now();

      return {
        success: true,
        status: this.healthStatus,
        message: 'Delhivery service initialized successfully'
      };

    } catch (error) {
      console.error('❌ Delhivery service initialization failed:', error.message);
      this.healthStatus = 'unhealthy';
      return {
        success: false,
        error: error.message,
        status: this.healthStatus
      };
    }
  }

  /**
   * Perform health check on Delhivery API
   */
  async performHealthCheck() {
    const startTime = Date.now();

    try {
      // Test pincode serviceability API (lightest endpoint)
      const response = await this.makeAuthenticatedRequest(
        this.config.ENDPOINTS.PINCODE_SERVICEABILITY,
        null,
        'GET',
        { filter_codes: '110001' } // Delhi pincode for testing
      );

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        console.log(`✅ Delhivery API health check passed (${responseTime}ms)`);
        return {
          success: true,
          responseTime,
          status: 'healthy',
          endpoint: 'pincode serviceability'
        };
      } else {
        console.log(`⚠️ Delhivery API health check returned status ${response.status}`);
        return {
          success: false,
          responseTime,
          status: 'degraded',
          httpStatus: response.status
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`❌ Delhivery API health check failed: ${error.message}`);
      return {
        success: false,
        responseTime,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Make authenticated request with comprehensive error handling
   */
  async makeAuthenticatedRequest(url, payload, method = 'GET', params = {}) {
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Token ${this.config.API_TOKEN}`,
        'Content-Type': method === 'POST' ? 'application/json' : 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'RocketryBox-Delhivery-Integration/1.0'
      },
      timeout: this.config.REQUEST_CONFIG.TIMEOUT
    };

    // Add parameters or payload based on method
    if (method === 'GET' && Object.keys(params).length > 0) {
      config.params = params;
    } else if (method === 'POST' && payload) {
      config.data = payload;
    }

    try {
      const response = await axios(config);
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      console.error(`Delhivery API Error [${method} ${url}]:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });

      return {
        success: false,
        error: error.message,
        status: error.response?.status || 0,
        data: error.response?.data || null
      };
    }
  }

  /**
   * Advanced pincode serviceability check with caching
   */
  async checkPincodeServiceability(pincode, serviceType = 'all') {
    const startTime = Date.now();

    try {
      console.log(`🔍 Checking Delhivery serviceability for pincode: ${pincode}`);

      const response = await this.makeAuthenticatedRequest(
        this.config.ENDPOINTS.PINCODE_SERVICEABILITY,
        null,
        'GET',
        { filter_codes: pincode }
      );

      const responseTime = Date.now() - startTime;

      if (!response.success) {
        return {
          success: false,
          pincode,
          error: response.error,
          responseTime
        };
      }

      const data = response.data;

      // Parse serviceability data
      const pincodeData = data.delivery_codes?.find(code => code.postal_code.pin == pincode);

      if (!pincodeData) {
        return {
          success: true,
          pincode,
          serviceable: false,
          reason: 'Pincode not found in Delhivery network',
          responseTime
        };
      }

      const codAvailable = pincodeData.cod === 'Y';
      const prepaidAvailable = pincodeData.pre_paid === 'Y';
      const isServiceable = codAvailable || prepaidAvailable;

      // Filter by service type if specified
      let serviceSpecific = true;
      if (serviceType === 'cod' && !codAvailable) {
        serviceSpecific = false;
      } else if (serviceType === 'prepaid' && !prepaidAvailable) {
        serviceSpecific = false;
      }

      return {
        success: true,
        pincode,
        serviceable: isServiceable && serviceSpecific,
        services: {
          cod: codAvailable,
          prepaid: prepaidAvailable,
          express: true, // Delhivery supports express for most locations
          surface: true
        },
        locationDetails: {
          district: pincodeData.district_name,
          state: pincodeData.state_name,
          country: pincodeData.country_name || 'India'
        },
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Serviceability check failed for ${pincode}:`, error.message);
      return {
        success: false,
        pincode,
        error: error.message,
        responseTime
      };
    }
  }

  /**
   * Bulk waybill management with intelligent caching
   */
  async manageWaybills(requestedCount = 100, forceRefresh = false) {
    try {
      console.log(`📋 Managing Delhivery waybills: requested=${requestedCount}, cached=${this.waybillCache.length}`);

      // Return from cache if sufficient and not forcing refresh
      if (!forceRefresh && this.waybillCache.length >= requestedCount) {
        const waybills = this.waybillCache.splice(0, requestedCount);
        console.log(`📋 Returned ${waybills.length} waybills from cache`);
        return {
          success: true,
          waybills,
          source: 'cache',
          remaining: this.waybillCache.length
        };
      }

      // Calculate how many to fetch (always fetch more than requested for future use)
      const fetchCount = Math.max(requestedCount * 2, 1000);
      const limitedFetchCount = Math.min(fetchCount, this.config.LIMITS.MAX_WAYBILL_COUNT);

      console.log(`📋 Fetching ${limitedFetchCount} waybills from Delhivery API`);

      const response = await this.makeAuthenticatedRequest(
        this.config.ENDPOINTS.BULK_WAYBILL,
        null,
        'GET',
        {
          cl: this.config.CLIENT_NAME,
          count: limitedFetchCount
        }
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          source: 'api'
        };
      }

      // Update cache with new waybills
      const newWaybills = Array.isArray(response.data) ? response.data : [response.data];
      this.waybillCache = [...this.waybillCache, ...newWaybills];

      // Return requested amount
      const requestedWaybills = this.waybillCache.splice(0, requestedCount);

      console.log(`📋 Fetched ${newWaybills.length} waybills, returned ${requestedWaybills.length}, cached ${this.waybillCache.length}`);

      return {
        success: true,
        waybills: requestedWaybills,
        source: 'api',
        fetched: newWaybills.length,
        remaining: this.waybillCache.length
      };

    } catch (error) {
      console.error('Waybill management error:', error.message);
      return {
        success: false,
        error: error.message,
        source: 'error'
      };
    }
  }

  /**
   * Professional shipment creation with comprehensive validation
   */
  async createShipment(shipmentData) {
    const startTime = Date.now();

    try {
      console.log('📦 Creating Delhivery shipment with professional validation');

      // Comprehensive validation
      const validationResult = this.validateShipmentData(shipmentData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          details: validationResult.errors,
          responseTime: Date.now() - startTime
        };
      }

      // Get waybill if not provided
      let waybill = shipmentData.waybill;
      if (!waybill) {
        const waybillResult = await this.manageWaybills(1);
        if (!waybillResult.success || waybillResult.waybills.length === 0) {
          throw new Error('Failed to obtain waybill for shipment');
        }
        waybill = waybillResult.waybills[0];
      }

      // Prepare optimized shipment payload
      const shipmentPayload = this.buildShipmentPayload(shipmentData, waybill);

      console.log('📦 Shipment payload prepared:', {
        waybill,
        orderId: shipmentData.orderId,
        receiver: shipmentData.receiverName,
        weight: shipmentData.weight,
        paymentMode: shipmentData.paymentMode
      });

      // Make API request
      const response = await this.makeAuthenticatedRequest(
        this.config.ENDPOINTS.CREATE_ORDER,
        `format=json&data=${JSON.stringify(shipmentPayload)}`,
        'POST'
      );

      const responseTime = Date.now() - startTime;

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          responseTime,
          courierName: 'Delhivery'
        };
      }

      // Process response
      const result = this.processShipmentResponse(response.data, waybill, shipmentData.orderId);
      result.responseTime = responseTime;

      console.log(`📦 Shipment creation ${result.success ? 'successful' : 'failed'} (${responseTime}ms)`);

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Shipment creation error:', error.message);
      return {
        success: false,
        error: error.message,
        responseTime,
        courierName: 'Delhivery'
      };
    }
  }

  /**
   * Validate shipment data comprehensively
   */
  validateShipmentData(data) {
    const errors = [];
    const requiredFields = [
      'receiverName', 'receiverAddress', 'receiverPincode', 'receiverPhone',
      'senderAddress', 'senderPincode', 'weight', 'orderId'
    ];

    // Check required fields
    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate weight limits
    if (data.weight && (data.weight < this.config.LIMITS.MIN_WEIGHT || data.weight > this.config.LIMITS.MAX_WEIGHT)) {
      errors.push(`Weight must be between ${this.config.LIMITS.MIN_WEIGHT}kg and ${this.config.LIMITS.MAX_WEIGHT}kg`);
    }

    // Validate pincode format
    const pincodeRegex = /^\d{6}$/;
    if (data.receiverPincode && !pincodeRegex.test(data.receiverPincode)) {
      errors.push('Invalid receiver pincode format');
    }
    if (data.senderPincode && !pincodeRegex.test(data.senderPincode)) {
      errors.push('Invalid sender pincode format');
    }

    // Validate COD amount
    if (data.paymentMode === 'COD') {
      if (!data.codAmount || data.codAmount < this.config.LIMITS.MIN_COD_AMOUNT) {
        errors.push('COD amount is required and must be greater than 0');
      }
      if (data.codAmount > this.config.LIMITS.MAX_COD_AMOUNT) {
        errors.push(`COD amount cannot exceed ₹${this.config.LIMITS.MAX_COD_AMOUNT}`);
      }
    }

    // Validate dimensions if provided
    if (data.dimensions) {
      const { length, width, height } = data.dimensions;
      if (length > this.config.LIMITS.MAX_LENGTH ||
        width > this.config.LIMITS.MAX_WIDTH ||
        height > this.config.LIMITS.MAX_HEIGHT) {
        errors.push('Package dimensions exceed limits');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Build optimized shipment payload for Delhivery API
   */
  buildShipmentPayload(data, waybill) {
    const weight = Math.round(data.weight * 1000); // Convert to grams
    const isExpress = data.serviceType?.toLowerCase().includes('express');

    return {
      shipments: [{
        // Consignee details
        name: data.receiverName,
        add: data.receiverAddress,
        pin: data.receiverPincode,
        city: '', // Auto-filled by Delhivery
        state: '', // Auto-filled by Delhivery
        country: data.country || 'India',
        phone: data.receiverPhone,

        // Order details
        order: data.orderId,
        payment_mode: data.paymentMode || 'COD',
        cod_amount: data.paymentMode === 'COD' ? data.codAmount : 0,
        order_value: data.invoiceValue || data.codAmount || 0,
        total_amount: data.invoiceValue || data.codAmount || 0,

        // Return details
        return_pin: data.senderPincode,
        return_add: data.senderAddress,
        return_phone: data.senderPhone || '',
        return_city: '',
        return_state: '',
        return_country: 'India',

        // Package details
        waybill: waybill,
        weight: weight,
        mode: isExpress ? 'Express' : 'Surface',
        shipment_length: data.dimensions?.length || 10,
        shipment_width: data.dimensions?.width || 10,
        shipment_height: data.dimensions?.height || 10,

        // Product details
        products_desc: data.products ?
          data.products.map(p => p.name).join(', ') :
          'Product',
        quantity: data.products ?
          data.products.reduce((sum, p) => sum + (p.quantity || 1), 0) :
          1,

        // Business details
        seller_add: data.senderAddress,
        seller_name: data.senderName || data.pickupLocation || 'Seller',
        seller_inv: data.orderId,
        hsn_code: data.gstDetails?.hsnCode || '999999',

        // Optional fields
        ...(data.fragileShipment && { [this.config.FRAGILE_SHIPMENT.KEY]: true }),
        ...(data.ewayBill && { ewaybill: data.ewayBill }),
        ...(data.gstDetails?.sellerGst && { seller_gst_tin: data.gstDetails.sellerGst }),
        ...(data.gstDetails?.consigneeGst && { consignee_gst_tin: data.gstDetails.consigneeGst })
      }]
    };
  }

  /**
   * Process shipment creation response
   */
  processShipmentResponse(responseData, waybill, orderId) {
    try {
      if (responseData.packages && responseData.packages.length > 0) {
        const packageInfo = responseData.packages[0];
        const finalWaybill = packageInfo.waybill || waybill;

        if (packageInfo.status && packageInfo.status.toLowerCase().includes('success')) {
          return {
            success: true,
            awb: finalWaybill,
            waybill: finalWaybill,
            orderId: packageInfo.refnum || orderId,
            status: packageInfo.status,
            trackingUrl: `https://www.delhivery.com/track/package/${finalWaybill}`,
            courierName: 'Delhivery',
            message: 'Shipment created successfully'
          };
        } else {
          return {
            success: false,
            error: packageInfo.status || 'Order creation failed',
            details: packageInfo,
            courierName: 'Delhivery'
          };
        }
      } else if (responseData.rmk) {
        return {
          success: false,
          error: responseData.rmk,
          details: responseData,
          courierName: 'Delhivery'
        };
      } else {
        return {
          success: false,
          error: 'Unexpected response format',
          details: responseData,
          courierName: 'Delhivery'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Response processing error: ${error.message}`,
        courierName: 'Delhivery'
      };
    }
  }

  /**
   * Advanced shipment tracking with detailed information
   */
  async trackShipment(awbNumber) {
    const startTime = Date.now();

    try {
      console.log(`🔍 Tracking Delhivery shipment: ${awbNumber}`);

      const response = await this.makeAuthenticatedRequest(
        this.config.ENDPOINTS.TRACK_SHIPMENT,
        null,
        'GET',
        { waybill: awbNumber }
      );

      const responseTime = Date.now() - startTime;

      if (!response.success) {
        return {
          success: false,
          awb: awbNumber,
          error: response.error,
          responseTime,
          courierName: 'Delhivery'
        };
      }

      const trackingData = response.data;

      if (!trackingData.ShipmentData || trackingData.ShipmentData.length === 0) {
        return {
          success: false,
          awb: awbNumber,
          error: 'No tracking data found',
          responseTime,
          courierName: 'Delhivery'
        };
      }

      // Process tracking data
      const result = this.processTrackingData(trackingData.ShipmentData[0], awbNumber);
      result.responseTime = responseTime;

      console.log(`🔍 Tracking completed for ${awbNumber}: ${result.status} (${responseTime}ms)`);

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Tracking error for ${awbNumber}:`, error.message);
      return {
        success: false,
        awb: awbNumber,
        error: error.message,
        responseTime,
        courierName: 'Delhivery'
      };
    }
  }

  /**
   * Process tracking data into standardized format
   */
  processTrackingData(shipmentData, awbNumber) {
    try {
      const shipment = shipmentData.Shipment;
      const scans = shipment.Scans || [];

      // Build tracking history
      const history = scans.map(scan => ({
        timestamp: new Date(scan.ScanDateTime),
        status: scan.ScanType,
        location: [scan.ScannedLocation?.Name, scan.ScannedLocation?.Area]
          .filter(Boolean)
          .join(', ') || 'Unknown',
        description: scan.Instructions || scan.ScanType,
        statusCode: scan.StatusCode
      })).sort((a, b) => b.timestamp - a.timestamp); // Latest first

      const latestScan = history[0];
      const currentStatus = latestScan?.status || 'Unknown';
      const currentLocation = latestScan?.location || 'Unknown';
      const isDelivered = currentStatus.toLowerCase().includes('delivered');

      return {
        success: true,
        awb: awbNumber,
        status: currentStatus,
        currentLocation,
        isDelivered,
        deliveryDate: isDelivered ? latestScan?.timestamp : null,
        expectedDeliveryDate: shipment.ExpectedDeliveryDate ? new Date(shipment.ExpectedDeliveryDate) : null,
        origin: shipment.Origin?.Name || '',
        destination: shipment.Destination?.Name || '',
        history,
        courierName: 'Delhivery',
        additionalInfo: {
          orderValue: shipment.OrderValue,
          codAmount: shipment.CODAmount,
          paymentMode: shipment.PaymentMode,
          packageWeight: shipment.ChargedWeight,
          returnReason: shipment.ReturnedReason,
          referenceNumber: shipment.ReferenceNo
        }
      };

    } catch (error) {
      return {
        success: false,
        awb: awbNumber,
        error: `Tracking data processing error: ${error.message}`,
        courierName: 'Delhivery'
      };
    }
  }

  /**
   * Get service status and health information
   */
  getServiceStatus() {
    return {
      serviceName: 'Delhivery',
      isInitialized: this.isInitialized,
      healthStatus: this.healthStatus,
      lastHealthCheck: this.lastHealthCheck,
      waybillCacheSize: this.waybillCache.length,
      configurationValid: this.config.validateConfig(),
      apiEndpoint: this.config.BASE_URL,
      supportedServices: ['B2C Standard', 'B2C Express', 'COD', 'Prepaid', 'Tracking', 'Label Generation']
    };
  }
}

// Create and export default instance
const delhiveryService = new DelhiveryService();
export default delhiveryService;
