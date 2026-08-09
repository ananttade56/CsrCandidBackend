const User = require('../models/User');
const Course = require('../models/Course');

const approveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseIds } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.status = 'Approved';
    if (courseIds && Array.isArray(courseIds)) {
      student.enrolledCourses = courseIds;
    }
    // If courseIds is not provided, we keep the student's existing enrolledCourses (their requests)

    await student.save();
    res.status(200).json({ message: 'Student approved successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error approving student', error: error.message });
  }
};

const rejectStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'Student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.status = 'Rejected';
    await student.save();
    res.status(200).json({ message: 'Student rejected successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting student', error: error.message });
  }
};

const removeAccess = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'User not found' });
    }

    student.enrolledCourses = student.enrolledCourses.filter(id => id.toString() !== courseId);
    await student.save();
    res.status(200).json({ message: 'Access removed successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error removing access', error: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    const course = new Course({ title, description, createdBy: req.user.id });
    await course.save();
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
};

const getCourses = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Student') {
        const user = await User.findById(req.user.id);
        if (user.enrolledCourses && user.enrolledCourses.length > 0) {
            query._id = { $in: user.enrolledCourses };
        } else {
            return res.status(200).json({ courses: [] });
        }
    }
    const courses = await Course.find(query).populate('createdBy', 'username');
    res.status(200).json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const course = await Course.findByIdAndUpdate(
      id,
      { title, description },
      { new: true, runValidators: true }
    );
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json({ message: 'Course updated successfully', course });
  } catch (error) {
    res.status(500).json({ message: 'Error updating course', error: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    // Note: Video cascading deletion could be added here if requested later
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
};

const getPendingStudents = async (req, res) => {
  try {
    const students = await User.find({ status: 'Pending' }).select('-password').populate('enrolledCourses', 'title');
    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending students', error: error.message });
  }
};

const getApprovedStudents = async (req, res) => {
  try {
    const students = await User.find({ status: 'Approved', role: 'Student' }).select('-password').populate('enrolledCourses', 'title');
    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approved students', error: error.message });
  }
};

module.exports = { approveStudent, rejectStudent, removeAccess, createCourse, getCourses, updateCourse, deleteCourse, getPendingStudents, getApprovedStudents };
