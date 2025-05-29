# BlueDart API Integration Setup Guide

## Overview
This guide provides step-by-step instructions for setting up BlueDart API integration in your RocketryBox application.

## Prerequisites
1. Active BlueDart business account
2. API access credentials from BlueDart
3. Valid License Key and User ID

## Required Credentials

You need to obtain the following credentials from BlueDart:

### Primary Credentials
- **User ID / Login ID**: Your BlueDart account login ID
- **License Key**: API license key provided by BlueDart
- **API Type**: Usually 'S' for standard API access
- **Version**: API version (typically '1.3')

### Optional Credentials (for newer API versions)
- **Consumer Key**: OAuth consumer key
- **Consumer Secret**: OAuth consumer secret

## Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# BlueDart API Configuration
BLUEDART_API_URL=https://apigateway.bluedart.com
BLUEDART_AUTH_URL=https://apigateway.bluedart.com/in/auth/v1/authenticate
BLUEDART_USER=your-bluedart-user-id
BLUEDART_LICENSE_KEY=your-bluedart-license-key
BLUEDART_CONSUMER_KEY=your-bluedart-consumer-key
BLUEDART_CONSUMER_SECRET=your-bluedart-consumer-secret
BLUEDART_API_TYPE=S
BLUEDART_VERSION=1.3
```

## Getting BlueDart API Credentials

### Step 1: Contact BlueDart Business Team
1. Email: business@bluedart.com
2. Phone: 1860 233 1234
3. Request API access for your business account

### Step 2: Provide Required Information
- Business registration details
- Expected monthly shipment volume
- Integration requirements
- Technical contact information

### Step 3: API Access Approval
- BlueDart will review your request
- They will provide test credentials for sandbox environment
- After testing, production credentials will be provided

## Testing the Integration

### Step 1: Verify Credentials
```bash
# Check if credentials are loaded
npm run test:bluedart-config
```

### Step 2: Test Authentication
```bash
# Test API authentication
npm run test:bluedart-auth
```

### Step 3: Test Rate Calculation
```bash
# Test rate calculation API
npm run test:bluedart-rates
```

## Common Issues and Solutions

### Issue 1: 404 Authentication Error
**Problem**: `BlueDart API endpoint not found`
**Solution**: 
- Verify the AUTH_URL is correct
- Contact BlueDart support to confirm API endpoint
- Check if your account has API access enabled

### Issue 2: 401 Authentication Error
**Problem**: `Invalid credentials`
**Solution**:
- Verify User ID and License Key are correct
- Check if credentials are for production or sandbox
- Ensure API access is activated for your account

### Issue 3: 403 Forbidden Error
**Problem**: `Access denied`
**Solution**:
- Verify your account has API permissions
- Check if API access is within allowed IP ranges
- Contact BlueDart to verify account status

## API Endpoints

### Authentication
- **URL**: `https://apigateway.bluedart.com/in/auth/v1/authenticate`
- **Method**: POST
- **Purpose**: Get JWT token for API access

### Rate Calculation
- **URL**: `https://apigateway.bluedart.com/in/transportation/rates/v1/CalculateRate`
- **Method**: POST
- **Purpose**: Calculate shipping rates

### Shipment Booking
- **URL**: `https://apigateway.bluedart.com/ShipmentBooking`
- **Method**: POST
- **Purpose**: Book shipments and get AWB

### Shipment Tracking
- **URL**: `https://apigateway.bluedart.com/ShipmentTracking`
- **Method**: POST
- **Purpose**: Track shipment status

## Professional Implementation Notes

1. **No Fallbacks**: This implementation does not use fallback mechanisms. If BlueDart API fails, the system will return appropriate error messages.

2. **Error Handling**: All errors are properly logged and returned with meaningful messages.

3. **Authentication Caching**: JWT tokens are cached to avoid unnecessary authentication calls.

4. **Timeout Configuration**: All API calls have proper timeout configurations.

5. **Logging**: Comprehensive logging for debugging and monitoring.

## Support Contacts

### BlueDart Support
- **Business Team**: business@bluedart.com
- **Technical Support**: tech.support@bluedart.com
- **Phone**: 1860 233 1234

### RocketryBox Support
- Check logs in `backend/logs/` directory
- Review error messages in application logs
- Contact system administrator for credential issues

## Security Best Practices

1. **Environment Variables**: Never commit API credentials to version control
2. **Access Control**: Limit API access to authorized personnel only
3. **Monitoring**: Monitor API usage and error rates
4. **Rotation**: Regularly rotate API credentials
5. **Validation**: Always validate API responses before processing

## Next Steps

1. Obtain BlueDart API credentials
2. Configure environment variables
3. Test the integration in sandbox environment
4. Deploy to production with production credentials
5. Monitor API performance and error rates

---

**Note**: This is a professional-grade integration that requires proper API credentials from BlueDart. Contact BlueDart business team to obtain the necessary credentials for your account. 