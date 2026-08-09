const Video = require('../models/Video');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const { courseId } = req.params;
    const { title, description } = req.body;
    
    const newVideo = new Video({
      title,
      description,
      filePath: req.file.path,
      courseId,
      uploadedBy: req.user.id,
      compressionStatus: 'processing'
    });

    await newVideo.save();
    res.status(201).json({ message: 'Video uploaded successfully, compression started', video: newVideo });

    // Background compression
    const inputPath = req.file.path;
    const ext = path.extname(inputPath);
    const outputPath = inputPath.replace(ext, `_compressed${ext}`);

    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        '-crf 28',
        '-preset fast',
        '-vf scale=-2:\'min(720,ih)\''
      ])
      .on('end', async () => {
        try {
          if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
          }
          fs.renameSync(outputPath, inputPath);
          
          newVideo.compressionStatus = 'completed';
          await newVideo.save();
          console.log(`Video compression completed for ${newVideo._id}`);
        } catch (err) {
          console.error('Error updating video status after compression:', err);
        }
      })
      .on('error', async (err) => {
        console.error(`Error compressing video ${newVideo._id}:`, err);
        try {
          newVideo.compressionStatus = 'failed';
          await newVideo.save();
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        } catch (updateErr) {
          console.error('Error updating status after failed compression:', updateErr);
        }
      })
      .save(outputPath);

  } catch (error) {
    res.status(500).json({ message: 'Error uploading video', error: error.message });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (req.user.role !== 'Admin' && video.uploadedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this video' });
    }

    const inputPath = video.filePath;
    const ext = path.extname(inputPath);
    const outputPath = inputPath.replace(ext, `_compressed${ext}`);

    try {
        if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
        }
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
    } catch (fsError) {
        console.warn(`Could not delete physical video files for ${videoId}. They might be locked (EBUSY):`, fsError.message);
        // Continue with database deletion even if physical file deletion fails.
    }

    await Video.findByIdAndDelete(videoId);
    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting video', error: error.message });
  }
};

const getVideos = async (req, res) => {
  try {
    const { courseId } = req.query;
    let query = {};
    
    if (courseId) {
        query.courseId = courseId;
    }

    if (req.user.role === 'Student') {
        const user = await User.findById(req.user.id);
        if (courseId && !user.enrolledCourses.includes(courseId)) {
            return res.status(403).json({ message: 'Not enrolled in this course' });
        }
        if (!courseId) {
            query.courseId = { $in: user.enrolledCourses };
        }
    }

    const videos = await Video.find(query).populate('courseId', 'title').populate('uploadedBy', 'username');
    
    // Generate signed URLs for each video
    const videosWithUrls = videos.map(video => {
      const token = jwt.sign(
        { videoId: video._id, userId: req.user.id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '2h' }
      );
      
      return {
        ...video.toObject(),
        streamUrl: `/api/videos/stream/${video._id}?token=${token}`
      };
    });

    res.status(200).json({ videos: videosWithUrls });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos', error: error.message });
  }
};

const streamVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided in URL.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }

    if (decoded.videoId !== videoId) {
      return res.status(403).json({ message: 'Token does not match video.' });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    const absolutePath = path.resolve(video.filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Video file not found on server.' });
    }

    // res.sendFile natively handles HTTP Range requests for video streaming
    res.sendFile(absolutePath);

  } catch (error) {
    res.status(500).json({ message: 'Error streaming video', error: error.message });
  }
};

module.exports = { uploadVideo, deleteVideo, getVideos, streamVideo };
