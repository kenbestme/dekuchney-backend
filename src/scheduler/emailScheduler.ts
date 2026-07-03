import cron from 'node-cron';
import axios from 'axios';

// Run every day at 6:00 AM
export function startEmailScheduler() {
  cron.schedule('0 6 * * *', async () => {
    console.log('⏰ Running automated email scheduler...');
    try {
      // Call the pre-arrival endpoint
      await axios.post('http://localhost:5000/api/communications/send-pre-arrival', {}, {
        headers: { 
          'x-internal-cron': process.env.CRON_SECRET || 'secret-key'
        }
      });
      console.log('✅ Pre-arrival emails processed');

      // Call the post-stay endpoint
      await axios.post('http://localhost:5000/api/communications/send-post-stay', {}, {
        headers: { 
          'x-internal-cron': process.env.CRON_SECRET || 'secret-key'
        }
      });
      console.log('✅ Post-stay emails processed');

    } catch (error) {
      console.error('❌ Scheduler error:', error);
    }
  });

  console.log('📧 Email scheduler started (runs daily at 6:00 AM)');
}