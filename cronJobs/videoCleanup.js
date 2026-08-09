const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');

// Schedule job to run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily video cleanup job...');
    try {
        // Calculate the date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Find all videos older than 7 days
        const oldVideos = await Video.find({ createdAt: { $lt: sevenDaysAgo } });
        
        if (oldVideos.length === 0) {
            console.log('No old videos found to clean up.');
            return;
        }

        console.log(`Found ${oldVideos.length} old videos to delete.`);

        for (const video of oldVideos) {
            try {
                const absolutePath = path.resolve(video.filePath);
                
                // 1. Delete physical file if it exists
                if (fs.existsSync(absolutePath)) {
                    fs.unlinkSync(absolutePath);
                    console.log(`Deleted file: ${absolutePath}`);
                } else {
                    console.log(`File not found, skipping file deletion: ${absolutePath}`);
                }

                // 2. Delete database record
                await Video.findByIdAndDelete(video._id);
                console.log(`Deleted database record for video: ${video._id}`);
                
            } catch (err) {
                console.error(`Error deleting video ${video._id}:`, err);
            }
        }
        
        console.log('Video cleanup job completed successfully.');
    } catch (error) {
        console.error('Error running video cleanup job:', error);
    }
});
