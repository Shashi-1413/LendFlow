import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lendflow';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path}`);
  next();
});

// Note: Static middleware moved after API routes to prevent conflicts

// Crash-Proof Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ FATAL: MongoDB connection failed:', error.message);
    console.error('❌ Application cannot start without database connection');
    process.exit(1); // Graceful exit instead of crash
  }
};

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

// Mongoose Schemas with strict validation
const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
    default: () => `CUST-${uuidv4().substring(0, 8).toUpperCase()}`
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

const loanSchema = new mongoose.Schema({
  loanId: {
    type: String,
    required: true,
    unique: true,
    default: () => `LOAN-${uuidv4().substring(0, 8).toUpperCase()}`
  },
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    ref: 'Customer'
  },
  amount: {
    type: Number,
    required: [true, 'Loan amount is required'],
    min: [1000, 'Minimum loan amount is ₹1,000'],
    max: [100000000, 'Maximum loan amount is ₹10,00,00,000']
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0.1, 'Interest rate must be at least 0.1%'],
    max: [50, 'Interest rate cannot exceed 50%']
  },
  term: {
    type: Number,
    required: [true, 'Loan term is required'],
    min: [1, 'Minimum loan term is 1 month'],
    max: [360, 'Maximum loan term is 360 months']
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'PAID_OFF'],
    default: 'ACTIVE'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  monthlyPayment: {
    type: Number,
    required: true,
    min: [1, 'Monthly payment must be positive']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [1, 'Total amount must be positive']
  },
  remainingBalance: {
    type: Number,
    required: true,
    min: [0, 'Remaining balance cannot be negative']
  }
}, {
  timestamps: true
});

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    default: () => `PAY-${uuidv4().substring(0, 8).toUpperCase()}`
  },
  loanId: {
    type: String,
    required: [true, 'Loan ID is required'],
    ref: 'Loan'
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [1, 'Payment amount must be at least ₹1']
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentType: {
    type: String,
    required: true,
    enum: ['EMI', 'LUMP_SUM'],
    default: 'EMI'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'check', 'bank_transfer', 'credit_card', 'debit_card'],
    default: 'bank_transfer'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot exceed 100 characters']
  }
}, {
  timestamps: true
});

// Create performance indexes
customerSchema.index({ email: 1 });
customerSchema.index({ customerId: 1 });
loanSchema.index({ customerId: 1 });
loanSchema.index({ loanId: 1 });
loanSchema.index({ status: 1 });
paymentSchema.index({ loanId: 1 });
paymentSchema.index({ paymentDate: -1 });

// Models
const Customer = mongoose.model('Customer', customerSchema);
const Loan = mongoose.model('Loan', loanSchema);
const Payment = mongoose.model('Payment', paymentSchema);

// Helper function to calculate monthly EMI payment
const calculateMonthlyPayment = (principal, annualRate, termMonths) => {
  try {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return Math.round((principal / termMonths) * 100) / 100;
    
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                    (Math.pow(1 + monthlyRate, termMonths) - 1);
    return Math.round(payment * 100) / 100;
  } catch (error) {
    console.error('Error calculating monthly payment:', error);
    throw new Error('Failed to calculate monthly payment');
  }
};

// Crash-Proof API Routes - Every route wrapped in try-catch

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      error: error.message 
    });
  }
});

// Get all customers
app.get('/api/v1/customers', async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

// Create new customer
app.post('/api/v1/customers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, email, phone, address) are required'
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }

    const customer = new Customer({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address.trim()
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
});

// Get all loans
app.get('/api/v1/loans', async (req, res) => {
  try {
    const { status, customerId } = req.query;
    const filter = {};
    
    if (status) filter.status = status.toUpperCase();
    if (customerId) filter.customerId = customerId;

    const loans = await Loan.find(filter).sort({ createdAt: -1 });
    
    // Get customer details for each loan
    const loansWithCustomers = await Promise.all(
      loans.map(async (loan) => {
        try {
          const customer = await Customer.findOne({ customerId: loan.customerId });
          return {
            ...loan.toObject(),
            customer: customer ? {
              name: customer.name,
              email: customer.email,
              phone: customer.phone
            } : null
          };
        } catch (error) {
          console.error(`Error fetching customer for loan ${loan.loanId}:`, error);
          return {
            ...loan.toObject(),
            customer: null
          };
        }
      })
    );

    res.json({
      success: true,
      data: loansWithCustomers,
      count: loansWithCustomers.length
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
      error: error.message
    });
  }
});

// Create new loan
app.post('/api/v1/loans', async (req, res) => {
  try {
    const { customerId, amount, interestRate, term } = req.body;

    // Validate required fields
    if (!customerId || !amount || !interestRate || !term) {
      return res.status(400).json({
        success: false,
        message: 'All fields (customerId, amount, interestRate, term) are required'
      });
    }

    // Validate numeric fields
    if (isNaN(amount) || isNaN(interestRate) || isNaN(term)) {
      return res.status(400).json({
        success: false,
        message: 'Amount, interest rate, and term must be valid numbers'
      });
    }

    if (Number(amount) < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum loan amount is ₹1,000'
      });
    }

    // Verify customer exists
    const customer = await Customer.findOne({ customerId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Calculate loan details
    const monthlyPayment = calculateMonthlyPayment(Number(amount), Number(interestRate), Number(term));
    const totalAmount = Math.round(monthlyPayment * Number(term) * 100) / 100;

    const loan = new Loan({
      customerId,
      amount: Number(amount),
      interestRate: Number(interestRate),
      term: Number(term),
      monthlyPayment,
      totalAmount,
      remainingBalance: totalAmount,
      status: 'ACTIVE'
    });

    await loan.save();

    res.status(201).json({
      success: true,
      message: 'Loan created successfully',
      data: loan
    });
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create loan',
      error: error.message
    });
  }
});

// Get loan by ID
app.get('/api/v1/loans/:loanId', async (req, res) => {
  try {
    const { loanId } = req.params;
    
    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: 'Loan ID is required'
      });
    }

    const loan = await Loan.findOne({ loanId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Get customer details
    const customer = await Customer.findOne({ customerId: loan.customerId });

    res.json({
      success: true,
      data: {
        ...loan.toObject(),
        customer: customer ? {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan',
      error: error.message
    });
  }
});

// Get payments for a loan
app.get('/api/v1/loans/:loanId/payments', async (req, res) => {
  try {
    const { loanId } = req.params;

    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: 'Loan ID is required'
      });
    }

    // Verify loan exists
    const loan = await Loan.findOne({ loanId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    const payments = await Payment.find({ loanId }).sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// Create new payment
app.post('/api/v1/loans/:loanId/payments', async (req, res) => {
  try {
    const { loanId } = req.params;
    const { amount, paymentType, paymentMethod, reference } = req.body;

    // Validate required fields
    if (!loanId || !amount || !paymentType || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Loan ID, amount, payment type, and payment method are required'
      });
    }

    // Validate amount
    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be a positive number'
      });
    }

    // Verify loan exists and is active
    const loan = await Loan.findOne({ loanId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.status === 'PAID_OFF') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add payment to a loan that is already paid off'
      });
    }

    // Prevent overpayment
    if (Number(amount) > loan.remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${amount}) exceeds remaining balance (₹${loan.remainingBalance})`
      });
    }

    // Create payment record
    const payment = new Payment({
      loanId,
      amount: Number(amount),
      paymentType: paymentType.toUpperCase(),
      paymentMethod: paymentMethod.toLowerCase(),
      reference: reference ? reference.trim() : undefined,
      status: 'completed'
    });

    await payment.save();

    // Update loan balance
    const newBalance = Math.round((loan.remainingBalance - Number(amount)) * 100) / 100;
    loan.remainingBalance = newBalance;

    // Update loan status if fully paid
    if (newBalance <= 0) {
      loan.status = 'PAID_OFF';
      loan.remainingBalance = 0;
    }

    await loan.save();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        loan: {
          loanId: loan.loanId,
          remainingBalance: loan.remainingBalance,
          status: loan.status
        }
      }
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
});

// Get dashboard statistics
app.get('/api/v1/dashboard', async (req, res) => {
  try {
    const [
      totalCustomers,
      totalLoans,
      activeLoans,
      paidOffLoans,
      totalLoanAmount,
      totalCollected
    ] = await Promise.all([
      Customer.countDocuments(),
      Loan.countDocuments(),
      Loan.countDocuments({ status: 'ACTIVE' }),
      Loan.countDocuments({ status: 'PAID_OFF' }),
      Loan.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const recentLoans = await Loan.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPayments = await Payment.find({ status: 'completed' })
      .sort({ paymentDate: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalCustomers,
          totalLoans,
          activeLoans,
          paidOffLoans,
          totalLoanAmount: totalLoanAmount[0]?.total || 0,
          totalCollected: totalCollected[0]?.total || 0
        },
        recentLoans,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// Serve React frontend for any non-API routes (SPA routing)
app.get('*', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } catch (error) {
    console.error('Error serving frontend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve application',
      error: error.message
    });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  try {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  } catch (handlerError) {
    console.error('Error in error handler:', handlerError);
    res.status(500).end();
  }
});

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Database Management Endpoints
app.get('/api/v1/database/test', (req, res) => {
  console.log('🔧 Database test endpoint hit');
  res.json({ success: true, message: 'Database test endpoint working' });
});

app.get('/api/v1/database/status', async (req, res) => {
  console.log('📊 Database status endpoint hit');
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const stats = await mongoose.connection.db.stats();
    
    const collectionStats = await Promise.all(
      collections.map(async (collection) => {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        const collStats = await mongoose.connection.db.collection(collection.name).stats();
        return {
          name: collection.name,
          count,
          size: collStats.size || 0,
          avgObjSize: collStats.avgObjSize || 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        connection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        database: mongoose.connection.name,
        collections: collectionStats,
        dbStats: {
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexSize: stats.indexSize,
          objects: stats.objects,
          collections: stats.collections
        }
      }
    });
  } catch (error) {
    console.error('Error getting database status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database status',
      error: error.message
    });
  }
});

app.get('/api/v1/database/backup', async (req, res) => {
  try {
    const customers = await Customer.find({}).lean();
    const loans = await Loan.find({}).lean();
    const payments = await Payment.find({}).lean();

    const backup = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      data: {
        customers,
        loans,
        payments
      },
      stats: {
        customers: customers.length,
        loans: loans.length,
        payments: payments.length
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="lendflow-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
});

app.post('/api/v1/database/clear', async (req, res) => {
  try {
    const { collections } = req.body;
    
    if (!collections || !Array.isArray(collections)) {
      return res.status(400).json({
        success: false,
        message: 'Please specify collections to clear'
      });
    }

    const results = {};
    
    if (collections.includes('customers')) {
      const result = await Customer.deleteMany({});
      results.customers = result.deletedCount;
    }
    
    if (collections.includes('loans')) {
      const result = await Loan.deleteMany({});
      results.loans = result.deletedCount;
    }
    
    if (collections.includes('payments')) {
      const result = await Payment.deleteMany({});
      results.payments = result.deletedCount;
    }

    res.json({
      success: true,
      message: 'Collections cleared successfully',
      data: results
    });
  } catch (error) {
    console.error('Error clearing collections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear collections',
      error: error.message
    });
  }
});

app.post('/api/v1/database/seed', async (req, res) => {
  try {
    // Sample customers for INR-based system
    const sampleCustomers = [
      {
        customerId: `CUST-${require('uuid').v4().substring(0, 8).toUpperCase()}`,
        name: 'Raj Patel',
        email: 'raj.patel@example.com',
        phone: '+91-9876543210',
        address: 'B-204, Sunshine Apartments, Andheri West, Mumbai, Maharashtra - 400058'
      },
      {
        customerId: `CUST-${require('uuid').v4().substring(0, 8).toUpperCase()}`,
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91-9123456789',
        address: 'A-45, Green Park, New Delhi, Delhi - 110016'
      },
      {
        customerId: `CUST-${require('uuid').v4().substring(0, 8).toUpperCase()}`,
        name: 'Arjun Kumar',
        email: 'arjun.kumar@example.com',
        phone: '+91-8765432109',
        address: 'C-301, Tech City, Electronic City, Bangalore, Karnataka - 560100'
      }
    ];

    const customers = await Customer.insertMany(sampleCustomers);
    
    // Sample loans with INR amounts
    const sampleLoans = [
      {
        customerId: customers[0].customerId,
        amount: 500000, // ₹5 lakhs
        interestRate: 8.5,
        term: 60,
        monthlyPayment: 10258.27,
        totalAmount: 615496.2,
        remainingBalance: 615496.2,
        status: 'ACTIVE'
      },
      {
        customerId: customers[1].customerId,
        amount: 1000000, // ₹10 lakhs
        interestRate: 9.0,
        term: 84,
        monthlyPayment: 15203.45,
        totalAmount: 1277089.8,
        remainingBalance: 1277089.8,
        status: 'ACTIVE'
      },
      {
        customerId: customers[2].customerId,
        amount: 250000, // ₹2.5 lakhs
        interestRate: 7.5,
        term: 36,
        monthlyPayment: 7828.32,
        totalAmount: 281819.52,
        remainingBalance: 281819.52,
        status: 'ACTIVE'
      }
    ];

    const loans = await Loan.insertMany(sampleLoans);

    res.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        customers: customers.length,
        loans: loans.length
      }
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed database',
      error: error.message
    });
  }
});

// Serve static files from dist directory (only for specific file extensions)
app.use(express.static(path.join(__dirname, '../dist'), {
  index: false, // Don't serve index.html automatically
  setHeaders: (res, filePath) => {
    // Only serve static assets, not routes
    if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.ico') || filePath.endsWith('.svg')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Catch-all handler: send back index.html for any non-API routes
app.get('*', (req, res) => {
  // Skip API routes - they should have been handled above
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      success: false, 
      message: 'API endpoint not found',
      path: req.path 
    });
  }
  
  // Serve the React app for all other routes
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Serve static files from dist directory (after ALL API routes)
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all handler: send back index.html for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server after database connection
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 LendFlow server running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
