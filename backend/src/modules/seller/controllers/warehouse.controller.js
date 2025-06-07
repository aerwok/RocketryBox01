import { AppError } from '../../../middleware/errorHandler.js';
import StockHistory from '../models/stockHistory.model.js';
import Warehouse from '../models/warehouse.model.js';
import WarehouseItem from '../models/warehouseItem.model.js';

// List warehouses
export const listWarehouses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { seller: req.user.id, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [warehouses, total] = await Promise.all([
      Warehouse.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Warehouse.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        warehouses,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add new warehouse
export const addWarehouse = async (req, res, next) => {
  try {
    const { name, address, city, state, pincode, country, contactPerson, phone, email } = req.body;

    // Validate required fields
    if (!name || !address || !city || !state || !pincode) {
      throw new AppError('Name, address, city, state, and pincode are required', 400);
    }

    // Check if warehouse with same name already exists for this seller
    const existingWarehouse = await Warehouse.findOne({
      seller: req.user.id,
      name: name.trim(),
      isActive: true
    });

    if (existingWarehouse) {
      throw new AppError('Warehouse with this name already exists', 400);
    }

    const warehouse = new Warehouse({
      seller: req.user.id,
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: country || 'India',
      contactPerson: contactPerson?.trim(),
      phone: phone?.trim(),
      email: email?.trim()
    });

    await warehouse.save();

    res.status(201).json({
      success: true,
      data: { warehouse }
    });
  } catch (error) {
    next(error);
  }
};

// List warehouse items
export const listWarehouseItems = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, location } = req.query;
    const query = { seller: req.user.id };
    if (status) query.status = status;
    if (location) query.location = location;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      WarehouseItem.find(query)
        .sort({ lastUpdated: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      WarehouseItem.countDocuments(query)
    ]);
    res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add stock to item
export const addStockToItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity, location, notes } = req.body;
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      throw new AppError('Invalid quantity', 400);
    }
    const item = await WarehouseItem.findOne({ _id: itemId, seller: req.user.id });
    if (!item) throw new AppError('Item not found', 404);
    item.quantity += Number(quantity);
    item.location = location || item.location;
    item.lastUpdated = new Date();
    // Update status
    if (item.quantity <= 0) item.status = 'Out of Stock';
    else if (item.quantity < 5) item.status = 'Low Stock';
    else item.status = 'In Stock';
    await item.save();
    // Create stock history
    await StockHistory.create({
      item: item._id,
      seller: req.user.id,
      quantity,
      location: item.location,
      notes,
      type: 'add'
    });
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};
