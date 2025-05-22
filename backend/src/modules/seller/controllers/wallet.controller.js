import WalletTransaction from '../models/walletTransaction.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import xlsx from 'xlsx';
import Seller from '../models/seller.model.js';

// Get wallet balance
export const getWalletBalance = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const seller = await Seller.findById(sellerId);
    
    if (!seller) {
      throw new AppError('Seller not found', 404);
    }
    
    // Get latest transaction for last recharge date
    const lastRecharge = await WalletTransaction.findOne({ 
      seller: sellerId, 
      type: 'Recharge' 
    }).sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        walletBalance: parseFloat(seller.walletBalance || '0'),
        lastRecharge: lastRecharge ? lastRecharge.date.getTime() : null,
        remittanceBalance: 0, // If you track remittance balance separately
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// List wallet transactions with filters and pagination
export const listWalletTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, startDate, endDate, search, sortBy = 'date', sortOrder = 'desc' } = req.query;
    const query = { seller: req.user.id };
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { referenceNumber: { $regex: search, $options: 'i' } },
        { remark: { $regex: search, $options: 'i' } }
      ];
    }
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const transactions = await WalletTransaction.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await WalletTransaction.countDocuments(query);
    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get wallet transaction details
export const getWalletTransaction = async (req, res, next) => {
  try {
    const transaction = await WalletTransaction.findOne({ _id: req.params.id, seller: req.user.id });
    if (!transaction) throw new AppError('Transaction not found', 404);
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// Export wallet transactions (CSV/XLSX)
export const exportWalletTransactions = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;
    const query = { seller: req.user.id };
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const transactions = await WalletTransaction.find(query).lean();
    const excelData = transactions.map(txn => ({
      'Date': txn.date ? new Date(txn.date).toISOString().split('T')[0] : '',
      'Reference Number': txn.referenceNumber,
      'Order ID': txn.orderId,
      'Type': txn.type,
      'Amount': txn.amount,
      'COD Charge': txn.codCharge,
      'IGST': txn.igst,
      'Sub Total': txn.subTotal,
      'Closing Balance': txn.closingBalance,
      'Remark': txn.remark
    }));
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelData);
    xlsx.utils.book_append_sheet(wb, ws, 'Wallet History');
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=wallet_history.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

// Credit COD remittance to wallet
export const creditCODToWallet = async (req, res, next) => {
  try {
    const { sellerId, amount, reference, remark } = req.body;
    if (!sellerId || !amount || isNaN(amount) || amount <= 0) {
      throw new AppError('Invalid sellerId or amount', 400);
    }
    const seller = await Seller.findById(sellerId);
    if (!seller) throw new AppError('Seller not found', 404);
    // Update wallet balance
    const currentBalance = parseFloat(seller.walletBalance || '0');
    seller.walletBalance = (currentBalance + parseFloat(amount)).toFixed(2);
    await seller.save();
    // Record wallet transaction
    const txn = await WalletTransaction.create({
      seller: seller._id,
      referenceNumber: reference || '',
      type: 'COD Credit',
      amount: amount.toString(),
      remark: remark || 'COD remittance credited to wallet',
      closingBalance: seller.walletBalance
    });
    res.status(200).json({ success: true, data: txn });
  } catch (error) {
    next(error);
  }
};

// Credit any amount to wallet (admin)
export const creditToWallet = async (req, res, next) => {
  try {
    const { sellerId, amount, reference, remark, type } = req.body;
    if (!sellerId || !amount || isNaN(amount) || amount <= 0) {
      throw new AppError('Invalid sellerId or amount', 400);
    }
    const seller = await Seller.findById(sellerId);
    if (!seller) throw new AppError('Seller not found', 404);
    // Update wallet balance
    const currentBalance = parseFloat(seller.walletBalance || '0');
    seller.walletBalance = (currentBalance + parseFloat(amount)).toFixed(2);
    await seller.save();
    // Record wallet transaction
    const txn = await WalletTransaction.create({
      seller: seller._id,
      referenceNumber: reference || '',
      type: type || 'Manual Credit',
      amount: amount.toString(),
      remark: remark || 'Manual credit to wallet',
      closingBalance: seller.walletBalance
    });
    res.status(200).json({ success: true, data: txn });
  } catch (error) {
    next(error);
  }
};

// Initiate wallet recharge (Razorpay)
export const initiateRecharge = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const sellerId = req.user.id;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new AppError('Invalid amount', 400);
    }
    
    // In a real app, we would create a Razorpay order here
    // For now, we'll just return a mock response
    res.status(200).json({
      success: true,
      data: {
        orderId: `rzp_${Date.now()}`,
        amount,
        currency: 'INR',
        key: 'rzp_test_key',
        name: 'Wallet Recharge',
        description: `Recharge of Rs ${amount}`,
        prefill: {
          name: req.user.name,
          email: req.user.email,
          contact: req.user.phone
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify wallet recharge (Razorpay)
export const verifyRecharge = async (req, res, next) => {
  try {
    const { paymentId, orderId, signature, amount } = req.body;
    const sellerId = req.user.id;
    
    // In a real app, we would verify the signature with Razorpay
    // For now, we'll just assume it's valid and update the wallet
    
    // Find the seller
    const seller = await Seller.findById(sellerId);
    if (!seller) throw new AppError('Seller not found', 404);
    
    // Update wallet balance
    const currentBalance = parseFloat(seller.walletBalance || '0');
    seller.walletBalance = (currentBalance + parseFloat(amount)).toFixed(2);
    await seller.save();
    
    // Record wallet transaction
    const txn = await WalletTransaction.create({
      seller: seller._id,
      referenceNumber: paymentId,
      type: 'Recharge',
      amount: amount.toString(),
      remark: 'Wallet recharge via Razorpay',
      closingBalance: seller.walletBalance
    });
    
    res.status(200).json({ 
      success: true, 
      data: { 
        transaction: txn,
        balance: seller.walletBalance
      } 
    });
  } catch (error) {
    next(error);
  }
}; 