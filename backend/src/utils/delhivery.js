import axios from 'axios';
import { DELHIVERY_CONFIG } from '../config/delhivery.config.js';
import { logger } from './logger.js';

/**
 * Delhivery API Integration Utility
 * Complete B2C and B2B shipping services implementation
 * Based on official Delhivery API documentation
 */

class DelhiveryAPI {
  constructor(config = DELHIVERY_CONFIG) {
    this.config = config;
    this.waybillCache = [];
    this.rateLimiters = {
      tracking: { requests: 0, resetTime: Date.now() },
      rateCalculation: { requests: 0, resetTime: Date.now() }
    };

    // B2B Authentication state
    this.b2bJwtToken = null;
    this.b2bTokenExpiry = null;
  }

  /**
   * B2B Authentication - Login to get JWT token
   * Token validity: 24 hours
   */
  async b2bLogin() {
    try {
      if (this.isB2BTokenValid()) {
        logger.info('B2B JWT token is still valid');
        return { success: true, token: this.b2bJwtToken };
      }

      logger.info('Logging in to Delhivery B2B API');

      const response = await this.makeB2BRequest(this.config.B2B_ENDPOINTS.LOGIN, {
        method: 'POST',
        data: {
          username: this.config.B2B_USERNAME,
          password: this.config.B2B_PASSWORD
        },
        skipAuth: true // Skip auth header for login
      });

      if (!response.success) {
        logger.error('B2B login failed:', response.error);
        return {
          success: false,
          error: response.error || 'B2B login failed'
        };
      }

      // Extract JWT token from response
      const token = response.data.token || response.data.access_token || response.data.jwt;

      if (!token) {
        logger.error('No JWT token received from B2B login response');
        return {
          success: false,
          error: 'No JWT token received'
        };
      }

      // Store token and expiry (24 hours from now)
      this.b2bJwtToken = token;
      this.b2bTokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

      logger.info('B2B JWT token obtained successfully');

      return {
        success: true,
        token: this.b2bJwtToken,
        expiresAt: this.b2bTokenExpiry
      };

    } catch (error) {
      logger.error('B2B login error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * B2B Authentication - Logout
   */
  async b2bLogout() {
    try {
      if (!this.b2bJwtToken) {
        return { success: true, message: 'No active session' };
      }

      const response = await this.makeB2BRequest(this.config.B2B_ENDPOINTS.LOGOUT, {
        method: 'POST'
      });

      // Clear token regardless of response
      this.b2bJwtToken = null;
      this.b2bTokenExpiry = null;

      logger.info('B2B logout completed');

      return {
        success: true,
        message: 'Logged out successfully'
      };

    } catch (error) {
      logger.error('B2B logout error:', error.message);
      // Clear token even on error
      this.b2bJwtToken = null;
      this.b2bTokenExpiry = null;

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if B2B JWT token is valid
   */
  isB2BTokenValid() {
    return this.b2bJwtToken &&
      this.b2bTokenExpiry &&
      Date.now() < this.b2bTokenExpiry;
  }

  /**
   * Ensure B2B authentication before API calls
   */
  async ensureB2BAuth() {
    if (this.isB2BTokenValid()) {
      return { success: true };
    }

    return await this.b2bLogin();
  }

  /**
   * Make B2B API request with JWT authentication
   */
  async makeB2BRequest(url, options = {}) {
    const {
      method = 'GET',
      data = null,
      params = {},
      headers = {},
      timeout = this.config.REQUEST_CONFIG.TIMEOUT,
      skipAuth = false
    } = options;

    const requestHeaders = {
      ...this.config.B2B_DEFAULT_HEADERS,
      ...headers
    };

    // Add JWT token for authenticated requests
    if (!skipAuth && this.b2bJwtToken) {
      requestHeaders.Authorization = `Bearer ${this.b2bJwtToken}`;
    }

    const config = {
      method,
      url,
      timeout,
      headers: requestHeaders
    };

    if (data) {
      if (method === 'GET') {
        config.params = { ...params, ...data };
      } else {
        config.data = data;
      }
    } else if (Object.keys(params).length > 0) {
      config.params = params;
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
      logger.error(`Delhivery B2B API Error: ${error.message}`, {
        url,
        method,
        status: error.response?.status,
        data: error.response?.data
      });

      // Handle token expiry
      if (error.response?.status === 401 && !skipAuth) {
        this.b2bJwtToken = null;
        this.b2bTokenExpiry = null;
        logger.warn('B2B JWT token expired, clearing token');
      }

      return {
        success: false,
        error: error.message,
        status: error.response?.status || 0,
        data: error.response?.data || null
      };
    }
  }

  /**
   * Make authenticated API request with rate limiting and error handling (B2C)
   */
  async makeRequest(url, options = {}) {
    const {
      method = 'GET',
      data = null,
      params = {},
      headers = {},
      timeout = this.config.REQUEST_CONFIG.TIMEOUT
    } = options;

    const config = {
      method,
      url,
      timeout,
      headers: {
        ...this.config.DEFAULT_HEADERS,
        ...headers
      }
    };

    if (data) {
      if (method === 'GET') {
        config.params = { ...params, ...data };
      } else {
        config.data = data;
      }
    } else if (Object.keys(params).length > 0) {
      config.params = params;
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
      logger.error(`Delhivery API Error: ${error.message}`, {
        url,
        method,
        status: error.response?.status,
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
   * Check rate limiting for specific endpoint
   */
  checkRateLimit(endpoint) {
    const limiter = this.rateLimiters[endpoint];
    if (!limiter) return true;

    const now = Date.now();
    const limit = this.config.REQUEST_CONFIG.RATE_LIMIT[endpoint.toUpperCase()];

    if (now > limiter.resetTime) {
      limiter.requests = 0;
      limiter.resetTime = now + limit.window;
    }

    if (limiter.requests >= limit.requests) {
      logger.warn(`Rate limit exceeded for Delhivery ${endpoint}`);
      return false;
    }

    limiter.requests++;
    return true;
  }

  // =============================================================================
  // B2B API METHODS
  // =============================================================================

  /**
   * B2B Serviceability Check
   * @param {string} pincode - Delivery pincode
   * @param {number} weight - Package weight in grams (optional)
   */
  async b2bCheckServiceability(pincode, weight = null) {
    try {
      const authResult = await this.ensureB2BAuth();
      if (!authResult.success) {
        return authResult;
      }

      logger.info(`B2B Serviceability check for pincode: ${pincode}`);

      const params = { pincode };
      if (weight) {
        params.weight = weight;
      }

      const response = await this.makeB2BRequest(this.config.B2B_ENDPOINTS.SERVICEABILITY, {
        params
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          pincode
        };
      }

      return {
        success: true,
        pincode,
        serviceable: response.data.serviceable || false,
        data: response.data
      };

    } catch (error) {
      logger.error(`B2B Serviceability check failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        pincode
      };
    }
  }

  /**
   * B2B Expected TAT (Turn Around Time)
   * @param {string} originPin - Origin pincode
   * @param {string} destinationPin - Destination pincode
   */
  async b2bGetExpectedTAT(originPin, destinationPin) {
    try {
      const authResult = await this.ensureB2BAuth();
      if (!authResult.success) {
        return authResult;
      }

      logger.info(`B2B TAT calculation: ${originPin} → ${destinationPin}`);

      const response = await this.makeB2BRequest(this.config.B2B_ENDPOINTS.EXPECTED_TAT, {
        params: {
          origin_pin: originPin,
          destination_pin: destinationPin
        },
        headers: {
          'X-Request-Id': `tat-${Date.now()}`
        }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error
        };
      }

      return {
        success: true,
        originPin,
        destinationPin,
        tat: response.data.tat || response.data.days,
        data: response.data
      };

    } catch (error) {
      logger.error(`B2B TAT calculation failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * B2B Freight Estimator
   * @param {Object} estimatorDetails - Freight estimation parameters
   */
  async b2bFreightEstimator(estimatorDetails) {
    try {
      const authResult = await this.ensureB2BAuth();
      if (!authResult.success) {
        return authResult;
      }

      const {
        dimensions, // [{ length_cm, width_cm, height_cm, box_count }]
        weightG,
        sourcePin,
        consigneePin,
        paymentMode, // 'cod' or 'prepaid'
        codAmount = 0,
        invAmount,
        freightMode, // 'fop' or 'fod' (for B2BR clients)
        chequePayment = false,
        rovInsurance = false
      } = estimatorDetails;

      logger.info(`B2B Freight estimation: ${sourcePin} → ${consigneePin}, ${weightG}g`);

      const requestData = {
        dimensions,
        weight_g: weightG,
        source_pin: sourcePin,
        consignee_pin: consigneePin,
        payment_mode: paymentMode,
        inv_amount: invAmount,
        cheque_payment: chequePayment,
        rov_insurance: rovInsurance
      };

      if (paymentMode === 'cod') {
        requestData.cod_amount = codAmount;
      }

      if (freightMode) {
        requestData.freight_mode = freightMode;
      }

      const response = await this.makeB2BRequest(this.config.B2B_ENDPOINTS.FREIGHT_ESTIMATOR, {
        method: 'POST',
        data: requestData
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error
        };
      }

      return {
        success: true,
        estimatedCost: response.data.freight_charge || response.data.total_charge,
        breakdown: response.data.breakdown || {},
        data: response.data
      };

    } catch (error) {
      logger.error(`B2B Freight estimation failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * B2B Create Warehouse
   * @param {Object} warehouseDetails - Warehouse creation parameters
   */
  async b2bCreateWarehouse(warehouseDetails) {
    try {
      const authResult = await this.ensureB2BAuth();
      if (!authResult.success) {
        return authResult;
      }

      const {
        name,
        pinCode,
        city,
        state,
        country = 'India',
        addressDetails,
        returnAddress = null,
        billingDetails = null,
        businessHours = null,
        pickupHours = null,
        pickupDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        businessDays = ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        sameAsFwdAdd = true,
        tinNumber = null,
        cstNumber = null,
        consigneeGst = null,
        isWarehouse = true,
        active = true
      } = warehouseDetails;

      logger.info(`B2B Creating warehouse: ${name} at ${pinCode}`);

      const requestData = {
        name,
        pin_code: pinCode,
        city,
        state,
        country,
        address_details: addressDetails,
        same_as_fwd_add: sameAsFwdAdd,
        pick_up_days: pickupDays,
        buisness_days: businessDays,
        is_warehouse: isWarehouse,
        active
      };

      if (returnAddress && !sameAsFwdAdd) {
        requestData.ret_address = returnAddress;
      }

      if (billingDetails) {
        requestData.billing_details = billingDetails;
      }

      if (businessHours) {
        requestData.buisness_hours = businessHours;
      }

      if (pickupHours) {
        requestData.pick_up_hours = pickupHours;
      }

      if (tinNumber) {
        requestData.tin_number = tinNumber;
      }

      if (cstNumber) {
        requestData.cst_number = cstNumber;
      }

      if (consigneeGst) {
        requestData.consignee_gst = consigneeGst;
      }

      const response = await this.makeB2BRequest(this.config.B2B_ENDPOINTS.CREATE_WAREHOUSE, {
        method: 'POST',
        data: requestData
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error
        };
      }

      return {
        success: true,
        warehouseId: response.data.warehouse_id || response.data.id,
        message: 'Warehouse created successfully',
        data: response.data
      };

    } catch (error) {
      logger.error(`B2B Warehouse creation failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * B2B Create Shipment (Manifest)
   * @param {Object} shipmentDetails - Complete B2B shipment details
   */
  async b2bCreateShipment(shipmentDetails) {
    try {
      const authResult = await this.ensureB2BAuth();
      if (!authResult.success) {
        return authResult;
      }

      const {
        pickupLocationName,
        pickupLocationId,
        paymentMode, // 'cod' or 'prepaid'
        codAmount = 0,
        weight, // in grams
        dropoffStoreCode = null,
        dropoffLocation,
        returnAddress = null,
        shipmentDetails: shipmentDetailsList,
        dimensions = null,
        rovInsurance = false,
        enablePaperlessMovement = false,
        callback = null,
        invoices,
        docFiles = null,
        docData = null,
        freightMode = 'fop', // 'fop' or 'fod'
        billingAddress,
        fmPickup = false,
        lrn = null
      } = shipmentDetails;

      logger.info(`B2B Creating shipment for ${paymentMode.toUpperCase()} ${weight}g`);

      // Prepare form data for multipart request
      const formData = new FormData();

      // Required fields
      formData.append('payment_mode', paymentMode);
      formData.append('weight', weight);
      formData.append('rov_insurance', rovInsurance);
      formData.append('fm_pickup', fmPickup);
      formData.append('freight_mode', freightMode);

      if (lrn) {
        formData.append('lrn', lrn);
      }

      if (pickupLocationName) {
        formData.append('pickup_location_name', pickupLocationName);
      }

      if (pickupLocationId) {
        formData.append('pickup_location_id', pickupLocationId);
      }

      if (paymentMode === 'cod') {
        formData.append('cod_amount', codAmount);
      }

      if (dropoffStoreCode) {
        formData.append('dropoff_store_code', dropoffStoreCode);
      } else if (dropoffLocation) {
        formData.append('dropoff_location', JSON.stringify(dropoffLocation));
      }

      if (returnAddress) {
        formData.append('return_address', JSON.stringify(returnAddress));
      }

      if (shipmentDetailsList) {
        formData.append('shipment_details', JSON.stringify(shipmentDetailsList));
      }

      if (dimensions) {
        formData.append('dimensions', JSON.stringify(dimensions));
      }

      if (enablePaperlessMovement) {
        formData.append('enable_paperless_movement', enablePaperlessMovement);
      }

      if (callback) {
        formData.append('callback', JSON.stringify(callback));
      }

      if (invoices) {
        formData.append('invoices', JSON.stringify(invoices));
      }

      if (billingAddress) {
        formData.append('billing_address', JSON.stringify(billingAddress));
      }

      if (docData) {
        formData.append('doc_data', JSON.stringify(docData));
      }

      // Handle document files
      if (docFiles && Array.isArray(docFiles)) {
        docFiles.forEach(file => {
          formData.append('doc_file', file);
        });
      }

      const response = await this.makeB2BRequest(this.config.B2B_ENDPOINTS.CREATE_SHIPMENT, {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error
        };
      }

      return {
        success: true,
        jobId: response.data.job_id || response.data.request_id,
        message: 'Shipment creation initiated',
        data: response.data
      };

    } catch (error) {
      logger.error(`B2B Shipment creation failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * B2B Get Shipment Status
   * @param {string} jobId - Job ID from shipment creation
   */
  async b2bGetShipmentStatus(jobId) {
    try {
      const authResult = await this.ensureB2BAuth();
      if (!authResult.success) {
        return authResult;
      }

      logger.info(`B2B Getting shipment status for job: ${jobId}`);

      const response = await this.makeB2BRequest(this.config.B2B_ENDPOINTS.SHIPMENT_STATUS, {
        params: { job_id: jobId }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error
        };
      }

      return {
        success: true,
        jobId,
        status: response.data.status,
        lrn: response.data.lrn,
        awbs: response.data.awbs || [],
        data: response.data
      };

    } catch (error) {
      logger.error(`B2B Shipment status check failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * B2B Track Shipment
   * @param {string} lrn - LR number to track
   * @param {boolean} allWbns - Whether to fetch all child waybills
   */
  async b2bTrackShipment(lrn, allWbns = false) {
    try {
      const authResult = await this.ensureB2BAuth();
      if (!authResult.success) {
        return authResult;
      }

      logger.info(`B2B Tracking shipment: ${lrn}`);

      const response = await this.makeB2BRequest(this.config.B2B_ENDPOINTS.TRACK_SHIPMENT, {
        params: {
          lrnum: lrn,
          all_wbns: allWbns
        }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          lrn
        };
      }

      return {
        success: true,
        lrn,
        status: response.data.status,
        currentLocation: response.data.current_location,
        isDelivered: response.data.status === 'DELIVERED',
        trackingHistory: response.data.tracking_data || [],
        data: response.data
      };

    } catch (error) {
      logger.error(`B2B Shipment tracking failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        lrn
      };
    }
  }

  /**
   * B2B Generate Shipping Label
   * @param {string} lrn - LR number
   * @param {string} size - Label size ('sm', 'md', 'a4', 'std')
   */
  async b2bGenerateShippingLabel(lrn, size = 'a4') {
    try {
      const authResult = await this.ensureB2BAuth();
      if (!authResult.success) {
        return authResult;
      }

      logger.info(`B2B Generating shipping label for LRN: ${lrn}, size: ${size}`);

      const response = await this.makeB2BRequest(this.config.B2B_ENDPOINTS.GENERATE_SHIPPING_LABEL, {
        params: {
          lrn,
          size
        }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          lrn
        };
      }

      return {
        success: true,
        lrn,
        size,
        labels: response.data.labels || [],
        data: response.data
      };

    } catch (error) {
      logger.error(`B2B Label generation failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        lrn
      };
    }
  }

  /**
   * B2B Create Pickup Request
   * @param {Object} pickupDetails - Pickup request details
   */
  async b2bCreatePickupRequest(pickupDetails) {
    try {
      const authResult = await this.ensureB2BAuth();
      if (!authResult.success) {
        return authResult;
      }

      const {
        clientWarehouse,
        pickupDate, // YYYY-MM-DD
        startTime, // HH:MM:SS
        expectedPackageCount
      } = pickupDetails;

      logger.info(`B2B Creating pickup request for ${clientWarehouse} on ${pickupDate}`);

      const response = await this.makeB2BRequest(this.config.B2B_ENDPOINTS.CREATE_PICKUP_REQUEST, {
        method: 'POST',
        data: {
          client_warehouse: clientWarehouse,
          pickup_date: pickupDate,
          start_time: startTime,
          expected_package_count: expectedPackageCount
        },
        headers: {
          'X-Request-Id': `pickup-${Date.now()}`
        }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error
        };
      }

      return {
        success: true,
        pickupId: response.data.pickup_id,
        message: 'Pickup request created successfully',
        data: response.data
      };

    } catch (error) {
      logger.error(`B2B Pickup request creation failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // =============================================================================
  // EXISTING B2C METHODS (keeping all existing functionality)
  // =============================================================================

  /**
   * Check pincode serviceability (B2C)
   * @param {string} pincode - Pincode to check
   * @returns {Object} Serviceability information
   */
  async checkServiceability(pincode) {
    try {
      logger.info(`Checking Delhivery serviceability for pincode: ${pincode}`);

      const response = await this.makeRequest(this.config.ENDPOINTS.PINCODE_SERVICEABILITY, {
        params: { filter_codes: pincode }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          pincode
        };
      }

      const data = response.data;

      // Check if pincode is serviceable
      const isServiceable = data.delivery_codes &&
        data.delivery_codes.some(code =>
          code.postal_code.pin == pincode &&
          (code.cod === 'Y' || code.pre_paid === 'Y')
        );

      const pincodeData = data.delivery_codes?.find(code => code.postal_code.pin == pincode);

      return {
        success: true,
        pincode,
        serviceable: isServiceable,
        codAvailable: pincodeData?.cod === 'Y',
        prepaidAvailable: pincodeData?.pre_paid === 'Y',
        details: pincodeData || null
      };

    } catch (error) {
      logger.error(`Serviceability check failed for ${pincode}: ${error.message}`);
      return {
        success: false,
        pincode,
        error: error.message
      };
    }
  }

  /**
   * Fetch bulk waybills for order creation
   * @param {number} count - Number of waybills to fetch (max 10000)
   * @returns {Object} Waybill list
   */
  async fetchWaybills(count = 100) {
    try {
      if (count > this.config.LIMITS.MAX_WAYBILL_COUNT) {
        count = this.config.LIMITS.MAX_WAYBILL_COUNT;
        logger.warn(`Waybill count limited to ${this.config.LIMITS.MAX_WAYBILL_COUNT}`);
      }

      logger.info(`Fetching ${count} waybills from Delhivery`);

      const response = await this.makeRequest(this.config.ENDPOINTS.BULK_WAYBILL, {
        params: {
          cl: this.config.CLIENT_NAME,
          count: count
        }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error
        };
      }

      // Cache waybills for future use
      if (response.data && Array.isArray(response.data)) {
        this.waybillCache = [...this.waybillCache, ...response.data];
        logger.info(`Cached ${response.data.length} waybills`);
      }

      return {
        success: true,
        waybills: response.data,
        count: response.data?.length || 0
      };

    } catch (error) {
      logger.error(`Waybill fetch failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get next available waybill from cache or fetch new ones
   */
  async getNextWaybill() {
    if (this.waybillCache.length === 0) {
      const result = await this.fetchWaybills(1000);
      if (!result.success) {
        return null;
      }
    }

    return this.waybillCache.shift();
  }

  /**
   * Calculate shipping rates
 * @param {Object} packageDetails - Package weight, dimensions, etc.
 * @param {Object} deliveryDetails - Pickup and delivery locations
 * @param {Object} partnerDetails - Partner configuration from database
 * @returns {Object} Shipping rate quote
 */
  async calculateRate(packageDetails, deliveryDetails, partnerDetails) {
    try {
      if (!this.checkRateLimit('rateCalculation')) {
        return {
          success: false,
          error: 'Rate limit exceeded for rate calculation',
          provider: { name: 'Delhivery' }
        };
      }

      const { weight, paymentMode = 'COD', serviceType = 'Surface' } = packageDetails;
      const { pickupPincode, deliveryPincode } = deliveryDetails;

      logger.info(`Calculating Delhivery rates: ${pickupPincode} → ${deliveryPincode}, ${weight}kg, ${serviceType}`);

      // Determine billing mode
      const billingMode = serviceType.toLowerCase().includes('express') ?
        this.config.RATE_PARAMS.BILLING_MODES.EXPRESS :
        this.config.RATE_PARAMS.BILLING_MODES.SURFACE;

      // Convert weight to grams
      const weightInGrams = Math.round(weight * 1000);

      const response = await this.makeRequest(this.config.ENDPOINTS.CALCULATE_RATES, {
        params: {
          md: billingMode,
          cgm: weightInGrams,
          o_pin: pickupPincode,
          d_pin: deliveryPincode,
          ss: this.config.RATE_PARAMS.SHIPMENT_STATUS.DELIVERED
        }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          provider: { name: 'Delhivery' }
        };
      }

      const rateData = response.data[0] || response.data;
      const totalAmount = rateData.total_amount || 0;

      // Determine service details
      const isExpress = billingMode === 'E';
      const estimatedDays = isExpress ? '1-2 days' : '3-5 days';

      return {
        success: true,
        provider: {
          id: partnerDetails.id || 'delhivery',
          name: 'Delhivery',
          serviceType: isExpress ? 'Express' : 'Surface',
          expressDelivery: isExpress,
          estimatedDays
        },
        totalRate: Math.round(totalAmount),
        breakdown: {
          baseRate: rateData.freight_charge || 0,
          fuelSurcharge: rateData.fuel_surcharge || 0,
          serviceCharge: rateData.service_charge || 0,
          additionalCharges: rateData.additional_charges || 0,
          tax: rateData.tax || 0
        },
        codAvailable: paymentMode === 'COD',
        transitTime: estimatedDays
      };

    } catch (error) {
      logger.error(`Delhivery rate calculation error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider: { name: 'Delhivery' }
      };
    }
  }

  /**
   * Create/Book a shipment
   * @param {Object} shipmentDetails - Complete shipment details
   * @param {Object} partnerDetails - Partner configuration
   * @returns {Object} Booking response with AWB, label, etc.
   */
  async bookShipment(shipmentDetails, partnerDetails) {
    try {
      logger.info('Creating Delhivery shipment order');

      const {
        // Sender details
        senderName,
        senderAddress,
        senderPincode,
        senderPhone,
        senderEmail,

        // Receiver details
        receiverName,
        receiverAddress,
        receiverPincode,
        receiverPhone,
        receiverEmail,

        // Package details
        weight,
        dimensions,
        products,
        paymentMode = 'COD',
        codAmount = 0,
        invoiceValue,

        // Order details
        orderId,
        waybill = null,
        serviceType = 'Surface',

        // Optional details
        pickupLocation,
        ewayBill,
        gstDetails,
        fragileShipment = false
      } = shipmentDetails;

      // Validate required fields
      const requiredFields = {
        receiverName, receiverAddress, receiverPincode, receiverPhone,
        senderAddress, senderPincode, weight, orderId
      };

      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Get waybill if not provided
      let assignedWaybill = waybill;
      if (!assignedWaybill) {
        assignedWaybill = await this.getNextWaybill();
        if (!assignedWaybill) {
          throw new Error('Unable to get waybill for shipment');
        }
      }

      // Prepare shipment data according to Delhivery API format
      const shipmentData = {
        shipments: [{
          name: receiverName,
          add: receiverAddress,
          pin: receiverPincode,
          city: '', // Will be auto-filled by Delhivery
          state: '', // Will be auto-filled by Delhivery
          country: 'India',
          phone: receiverPhone,
          order: orderId,
          payment_mode: this.config.PAYMENT_MODES[paymentMode.toUpperCase()] || 'COD',
          return_pin: senderPincode,
          return_city: '',
          return_phone: senderPhone,
          return_add: senderAddress,
          return_state: '',
          return_country: 'India',
          products_desc: products ? products.map(p => p.name).join(', ') : 'Product',
          hsn_code: gstDetails?.hsnCode || '999999',
          cod_amount: paymentMode === 'COD' ? codAmount : 0,
          order_value: invoiceValue || codAmount,
          total_amount: invoiceValue || codAmount,
          seller_add: senderAddress,
          seller_name: senderName || pickupLocation,
          seller_inv: orderId,
          quantity: products ? products.reduce((sum, p) => sum + (p.quantity || 1), 0) : 1,
          waybill: assignedWaybill,
          shipment_length: dimensions?.length || 10,
          shipment_width: dimensions?.width || 10,
          shipment_height: dimensions?.height || 10,
          weight: Math.round(weight * 1000), // Convert to grams
          mode: serviceType.toLowerCase().includes('express') ? 'Express' : 'Surface',
          carrier: 99 // Default carrier for Delhivery
        }]
      };

      // Add E-way bill details if required
      if (ewayBill && invoiceValue > this.config.EWAY_BILL.MANDATORY_AMOUNT) {
        shipmentData.shipments[0].ewaybill = ewayBill;
      }

      // Add GST details if provided
      if (gstDetails) {
        shipmentData.shipments[0].seller_gst_tin = gstDetails.sellerGst;
        shipmentData.shipments[0].consignee_gst_tin = gstDetails.consigneeGst;
        shipmentData.shipments[0].invoice_reference = gstDetails.invoiceReference;
      }

      // Add fragile shipment flag
      if (fragileShipment) {
        shipmentData.shipments[0][this.config.FRAGILE_SHIPMENT.KEY] = this.config.FRAGILE_SHIPMENT.VALUE;
      }

      const requestData = {
        format: 'json',
        data: JSON.stringify(shipmentData)
      };

      const response = await this.makeRequest(this.config.ENDPOINTS.CREATE_ORDER, {
        method: 'POST',
        data: requestData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          courierName: 'Delhivery'
        };
      }

      const responseData = response.data;
      const isSuccess = responseData.packages && responseData.packages.length > 0;

      if (isSuccess) {
        const packageInfo = responseData.packages[0];
        const awb = packageInfo.waybill || assignedWaybill;

        return {
          success: true,
          awb,
          waybill: awb,
          trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
          orderId: packageInfo.refnum || orderId,
          status: packageInfo.status,
          courierName: 'Delhivery',
          message: 'Shipment created successfully'
        };
      } else {
        return {
          success: false,
          error: responseData.rmk || 'Order creation failed',
          details: responseData,
          courierName: 'Delhivery'
        };
      }

    } catch (error) {
      logger.error(`Delhivery shipment booking error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        courierName: 'Delhivery'
      };
    }
  }

  /**
       * Track a shipment
   * @param {string} trackingNumber - AWB number to track
       * @param {Object} partnerDetails - Partner configuration
       * @returns {Object} Tracking information
       */
  async trackShipment(trackingNumber, partnerDetails) {
    try {
      if (!this.checkRateLimit('tracking')) {
        return {
          success: false,
          error: 'Rate limit exceeded for tracking',
          courierName: 'Delhivery'
        };
      }

      logger.info(`Tracking Delhivery shipment: ${trackingNumber}`);

      const response = await this.makeRequest(this.config.ENDPOINTS.TRACK_SHIPMENT, {
        params: { waybill: trackingNumber }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          awb: trackingNumber,
          courierName: 'Delhivery'
        };
      }

      const trackingData = response.data;

      if (!trackingData.ShipmentData || trackingData.ShipmentData.length === 0) {
        return {
          success: false,
          error: 'No tracking data found',
          awb: trackingNumber,
          courierName: 'Delhivery'
        };
      }

      const shipment = trackingData.ShipmentData[0].Shipment;
      const scans = shipment.Scans || [];

      // Parse tracking history
      const history = scans.map(scan => ({
        timestamp: new Date(scan.ScanDateTime),
        status: scan.ScanType,
        location: `${scan.ScannedLocation?.Name || ''}, ${scan.ScannedLocation?.Area || ''}`.trim(),
        description: scan.Instructions || scan.ScanType,
        statusCode: scan.StatusCode
      })).reverse(); // Latest first

      const currentStatus = history[0]?.status || 'Unknown';
      const currentLocation = history[0]?.location || 'Unknown';
      const isDelivered = currentStatus.toLowerCase().includes('delivered');

      return {
        success: true,
        awb: trackingNumber,
        status: currentStatus,
        currentLocation,
        isDelivered,
        deliveryDate: isDelivered ? history[0]?.timestamp : null,
        expectedDeliveryDate: shipment.ExpectedDeliveryDate || null,
        origin: shipment.Origin?.Name || '',
        destination: shipment.Destination?.Name || '',
        history,
        courierName: 'Delhivery',
        additionalInfo: {
          orderValue: shipment.OrderValue,
          codAmount: shipment.CODAmount,
          paymentMode: shipment.PaymentMode,
          packageWeight: shipment.ChargedWeight,
          returnReason: shipment.ReturnedReason
        }
      };

    } catch (error) {
      logger.error(`Delhivery tracking error for ${trackingNumber}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        awb: trackingNumber,
        courierName: 'Delhivery'
      };
    }
  }

  /**
   * Generate shipping label
   * @param {string} waybill - Waybill number
   * @param {boolean} returnPdf - Whether to return PDF or JSON
   * @returns {Object} Label data
   */
  async generateShippingLabel(waybill, returnPdf = true) {
    try {
      logger.info(`Generating Delhivery shipping label for: ${waybill}`);

      const response = await this.makeRequest(this.config.ENDPOINTS.GENERATE_LABEL, {
        params: {
          wbns: waybill,
          pdf: returnPdf ? 'true' : 'false'
        }
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          waybill
        };
      }

      return {
        success: true,
        waybill,
        labelData: response.data,
        isBase64: returnPdf,
        message: 'Label generated successfully'
      };

    } catch (error) {
      logger.error(`Label generation error for ${waybill}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        waybill
      };
    }
  }

  /**
   * Create pickup request
   * @param {Object} pickupDetails - Pickup details
   * @returns {Object} Pickup request response
   */
  async createPickupRequest(pickupDetails) {
    try {
      const {
        pickupLocation,
        pickupDate,
        pickupTime,
        expectedPackageCount,
        contactPersonName,
        contactPhone
      } = pickupDetails;

      logger.info(`Creating Delhivery pickup request for ${pickupLocation}`);

      const requestData = {
        pickup_time: pickupTime,
        pickup_date: pickupDate,
        pickup_location: pickupLocation,
        expected_package_count: expectedPackageCount
      };

      const response = await this.makeRequest(this.config.ENDPOINTS.CREATE_PICKUP, {
        method: 'POST',
        data: requestData
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error
        };
      }

      return {
        success: true,
        pickupId: response.data.pickup_id || response.data.id,
        message: response.data.message || 'Pickup request created successfully',
        data: response.data
      };

    } catch (error) {
      logger.error(`Pickup request creation error: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const delhiveryAPI = new DelhiveryAPI();

// Export individual functions for compatibility with existing code
export const calculateRate = (packageDetails, deliveryDetails, partnerDetails) => {
  return delhiveryAPI.calculateRate(packageDetails, deliveryDetails, partnerDetails);
};

export const bookShipment = (shipmentDetails, partnerDetails) => {
  return delhiveryAPI.bookShipment(shipmentDetails, partnerDetails);
};

export const trackShipment = (trackingNumber, partnerDetails) => {
  return delhiveryAPI.trackShipment(trackingNumber, partnerDetails);
};

export const checkServiceability = (pincode) => {
  return delhiveryAPI.checkServiceability(pincode);
};

export const fetchWaybills = (count) => {
  return delhiveryAPI.fetchWaybills(count);
};

export const generateShippingLabel = (waybill, returnPdf) => {
  return delhiveryAPI.generateShippingLabel(waybill, returnPdf);
};

export const createPickupRequest = (pickupDetails) => {
  return delhiveryAPI.createPickupRequest(pickupDetails);
};

// Export the API class as well for advanced usage
export { DelhiveryAPI };

// Export default API instance
export default delhiveryAPI;
