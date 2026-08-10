const express = require('express');
const router = express.Router();
const { approveStudent, rejectStudent, removeAccess, createCourse, getCourses, updateCourse, deleteCourse, getPendingStudents, getApprovedStudents } = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.use(verifyToken);

const requireAdmin = authorizeRoles('Admin');
const { uploadImage } = require('../middlewares/uploadMiddleware');

router.post('/upload-image', requireAdmin, uploadImage.single('icon'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

router.post('/approve-student/:studentId', requireAdmin, approveStudent);
router.post('/reject-student/:studentId', requireAdmin, rejectStudent);
router.get('/pending-students', requireAdmin, getPendingStudents);
router.get('/approved-students', requireAdmin, getApprovedStudents);
router.post('/remove-access/:studentId/:courseId', requireAdmin, removeAccess);
router.post('/course', requireAdmin, createCourse);
router.get('/course', authorizeRoles('Admin', 'Teacher', 'Student'), getCourses);
router.put('/course/:id', requireAdmin, updateCourse);
router.delete('/course/:id', requireAdmin, deleteCourse);

module.exports = router;
