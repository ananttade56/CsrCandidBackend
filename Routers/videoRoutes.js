const express = require('express');
const router = express.Router();
const { uploadVideo, uploadChunk, deleteVideo, getVideos, streamVideo } = require('../controllers/videoController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { uploadVideo: uploadVideoMiddleware } = require('../middlewares/uploadMiddleware');

// Stream video route must be before verifyToken because it uses query params for auth
router.get('/stream/:videoId', streamVideo);

router.use(verifyToken);

router.post('/upload/:courseId', authorizeRoles('Admin', 'Teacher'), uploadVideoMiddleware.single('video'), uploadVideo);
router.post('/upload/chunk/:courseId', authorizeRoles('Admin', 'Teacher'), uploadVideoMiddleware.single('chunk'), uploadChunk);
router.delete('/:videoId', authorizeRoles('Admin', 'Teacher'), deleteVideo);
router.get('/', getVideos);

module.exports = router;
