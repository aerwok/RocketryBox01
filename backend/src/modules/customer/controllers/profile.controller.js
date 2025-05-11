import Customer from '../models/customer.model.js';
import { AppError } from '../../../middleware/errorHandler.js';

// Get customer profile
export const getProfile = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Update customer profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, preferences } = req.body;

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    // Update fields if provided
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (preferences) {
      if (preferences.language) customer.preferences.language = preferences.language;
      if (preferences.currency) customer.preferences.currency = preferences.currency;
      if (preferences.notifications) {
        if (preferences.notifications.email !== undefined) {
          customer.preferences.notifications.email = preferences.notifications.email;
        }
        if (preferences.notifications.sms !== undefined) {
          customer.preferences.notifications.sms = preferences.notifications.sms;
        }
        if (preferences.notifications.push !== undefined) {
          customer.preferences.notifications.push = preferences.notifications.push;
        }
      }
    }

    await customer.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'Profile updated successfully',
        profile: customer
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Add new address
export const addAddress = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      address1,
      address2,
      city,
      state,
      pincode,
      country,
      isDefault
    } = req.body;

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    // If this is the first address or isDefault is true, set it as default
    if (isDefault || customer.addresses.length === 0) {
      // Set all other addresses to non-default
      customer.addresses.forEach(addr => addr.isDefault = false);
    }

    // Add new address
    customer.addresses.push({
      name,
      phone,
      address1,
      address2,
      city,
      state,
      pincode,
      country: country || 'India',
      isDefault: isDefault || customer.addresses.length === 0
    });

    await customer.save();

    res.status(201).json({
      success: true,
      data: {
        message: 'Address added successfully',
        addresses: customer.addresses
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Update address
export const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const {
      name,
      phone,
      address1,
      address2,
      city,
      state,
      pincode,
      country,
      isDefault
    } = req.body;

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    // Find address
    const address = customer.addresses.id(addressId);

    if (!address) {
      return next(new AppError('Address not found', 404));
    }

    // Update address fields
    if (name) address.name = name;
    if (phone) address.phone = phone;
    if (address1) address.address1 = address1;
    if (address2 !== undefined) address.address2 = address2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;
    if (country) address.country = country;

    // Handle default address
    if (isDefault) {
      customer.addresses.forEach(addr => {
        addr.isDefault = addr._id.toString() === addressId;
      });
    }

    await customer.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'Address updated successfully',
        addresses: customer.addresses
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Delete address
export const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;

    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    // Find address
    const address = customer.addresses.id(addressId);

    if (!address) {
      return next(new AppError('Address not found', 404));
    }

    // Remove address
    customer.addresses.pull(addressId);

    // If deleted address was default and there are other addresses,
    // set the first remaining address as default
    if (address.isDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }

    await customer.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'Address deleted successfully',
        addresses: customer.addresses
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
}; 