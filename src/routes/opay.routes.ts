import { Router } from 'express';
const OPay = require('opay-node');

const router = Router();

router.post('/initialize-opay', async (req: any, res: any) => {
  console.log('📦 OPay initialization:', req.body);
  const { email, amount, bookingId, fullName } = req.body;

  if (!email || !amount || !bookingId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const public_key = process.env.OPAY_PUBLIC_KEY;
  const secret_key = process.env.OPAY_SECRET_KEY;
  const merchantId = process.env.OPAY_MERCHANT_ID;
  const environment = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST';

  const opay = new OPay(public_key, secret_key, merchantId, environment);

  try {
    const response = await opay.initializeTransaction({
      reference: `booking_${bookingId}_${Date.now()}`,
      mchShortName: 'De Kuchney Villa',
      productName: 'Hotel Booking',
      productDesc: `Booking ID: ${bookingId}`,
      userPhone: '08012345678',
      userRequestIp: req.ip || req.connection.remoteAddress,
      amount: amount.toString(),
      callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/opay-webhook`,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-confirmation?booking_id=${bookingId}`,
      expireAt: '30',
    });

    if (response?.data?.cashierUrl) {
      res.json({ success: true, authorization_url: response.data.cashierUrl });
    } else {
      throw new Error('No cashierUrl returned');
    }
  } catch (error: any) {
    console.error('❌ OPay error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/opay-webhook', async (req: any, res: any) => {
  console.log('🔔 OPay webhook received:', req.body);
  // TODO: verify signature, update booking payment_status
  res.sendStatus(200);
});

export default router;