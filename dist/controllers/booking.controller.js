"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBooking = void 0;
const db_1 = __importDefault(require("../config/db"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const createBooking = async (req, res) => {
    console.log('\n========== BOOKING REQUEST ==========');
    console.log('Request body:', req.body);
    try {
        const { fullName, email, checkIn, checkOut, requests, suite, amount, status } = req.body;
        if (!fullName || !email || !checkIn || !checkOut || !suite) {
            res.status(400).json({ success: false, message: 'Missing required fields' });
            return;
        }
        // 👇 CHANGE THIS TO YOUR ACTUAL COLUMN NAME (e.g., 'full_name', 'name', 'guest_fullname')
        const columnNameForGuest = 'full_name'; // <--- UPDATE THIS LINE
        const [result] = await db_1.default.query(`INSERT INTO bookings (${columnNameForGuest}, email, suite_name, check_in, check_out, special_requests, amount, payment_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [fullName, email, suite, checkIn, checkOut, requests || '', amount || 0, status || 'pending']);
        console.log('MySQL insert result:', result);
        const bookingId = result?.insertId;
        if (!bookingId) {
            console.error('❌ No insertId returned. Check if table has AUTO_INCREMENT primary key.');
            res.status(500).json({ success: false, message: 'Database did not return an ID' });
            return;
        }
        console.log(`✅ Booking created with ID: ${bookingId}`);
        res.status(201).json({
            success: true,
            id: bookingId,
            message: 'Booking reserved successfully.'
        });
        setImmediate(async () => {
            try {
                const transporter = nodemailer_1.default.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: `Booking Confirmation - ${suite}`,
                    text: `Dear ${fullName},\n\nBooking ID: ${bookingId}\nSuite: ${suite}\nDates: ${checkIn} to ${checkOut}\n\nThank you.`
                });
                console.log('Confirmation email sent');
            }
            catch (err) {
                console.error('Email failed (non-critical):', err);
            }
        });
    }
    catch (error) {
        console.error('❌ Booking creation error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message,
                sqlMessage: error.sqlMessage
            });
        }
    }
};
exports.createBooking = createBooking;
