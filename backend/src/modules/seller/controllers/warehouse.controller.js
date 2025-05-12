import WarehouseItem from '../models/warehouseItem.model.js';
import StockHistory from '../models/stockHistory.model.js';
import { AppError } from '../../../middleware/errorHandler.js';

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