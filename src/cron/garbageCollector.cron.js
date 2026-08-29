const cron = require('node-cron');
const db = require('../db');
const cloudinary = require('cloudinary').v2;

const initGarbageCollector = () => {
  // Runs every day at 3:00 AM (0 3 * * *)
  cron.schedule('0 3 * * *', async () => {
    console.log('[Cron GC] Running orphaned media storage purge job...');
    try {
      // Find media uploaded > 24h ago that has no associated property_listing
      const unlinkedMedia = await db.query(
        `SELECT media_id, url, public_id 
         FROM listing_media 
         WHERE property_id IS NULL 
           AND created_at < NOW() - INTERVAL '24 hours'`
      );

      if (unlinkedMedia.rows.length === 0) {
        console.log('[Cron GC] No orphaned media assets to clean up.');
        return;
      }

      for (const media of unlinkedMedia.rows) {
        if (media.public_id) {
          await cloudinary.uploader.destroy(media.public_id);
        }

        await db.query('DELETE FROM listing_media WHERE media_id = $1', [media.media_id]);
        console.log(`[Cron GC] Purged orphaned asset: ${media.media_id}`);
      }
    } catch (err) {
      console.error('[Cron GC] Error during garbage collection run:', err);
    }
  });
};

module.exports = { initGarbageCollector };
