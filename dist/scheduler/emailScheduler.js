"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEmailScheduler = startEmailScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const axios_1 = __importDefault(require("axios"));
// Run every day at 6:00 AM
function startEmailScheduler() {
    node_cron_1.default.schedule('0 6 * * *', async () => {
        console.log('⏰ Running automated email scheduler...');
        try {
            // Call the pre-arrival endpoint
            await axios_1.default.post('http://localhost:5000/api/communications/send-pre-arrival', {}, {
                headers: {
                    'x-internal-cron': process.env.CRON_SECRET || 'secret-key'
                }
            });
            console.log('✅ Pre-arrival emails processed');
            // Call the post-stay endpoint
            await axios_1.default.post('http://localhost:5000/api/communications/send-post-stay', {}, {
                headers: {
                    'x-internal-cron': process.env.CRON_SECRET || 'secret-key'
                }
            });
            console.log('✅ Post-stay emails processed');
        }
        catch (error) {
            console.error('❌ Scheduler error:', error);
        }
    });
    console.log('📧 Email scheduler started (runs daily at 6:00 AM)');
}
