const express = require('express');
const router = express.Router();
const { uploadVideo, deleteVideo, getVideos, streamVideo } = require('../controllers/videoController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Stream video route must be before verifyToken because it uses query params for auth
router.get('/stream/:videoId', streamVideo);

router.use(verifyToken);

router.post('/upload/:courseId', authorizeRoles('Admin', 'Teacher'), upload.single('video'), uploadVideo);
router.delete('/:videoId', authorizeRoles('Admin', 'Teacher'), deleteVideo);
router.get('/', getVideos);

module.exports = router;
