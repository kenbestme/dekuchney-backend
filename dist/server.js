"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Import Routes
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const opay_routes_1 = __importDefault(require("./routes/opay.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const reviews_routes_1 = __importDefault(require("./routes/reviews.routes"));
const gallery_routes_1 = __importDefault(require("./routes/gallery.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const communications_routes_1 = __importDefault(require("./routes/communications.routes")); // ✅ NEW
// Import Scheduler
const scheduler_1 = require("./scheduler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// API Routes
app.use('/api/rooms', room_routes_1.default);
app.use('/api/bookings', booking_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/payments', opay_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/reviews', reviews_routes_1.default);
app.use('/api/gallery', gallery_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/communications', communications_routes_1.default); // ✅ NEW
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'active', timestamp: new Date().toISOString() });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});
app.listen(PORT, () => {
    console.log(`✅ Server active on http://localhost:${PORT}`);
    // ✅ Start the email scheduler
    (0, scheduler_1.startEmailScheduler)();
});
