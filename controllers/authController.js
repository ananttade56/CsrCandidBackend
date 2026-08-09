const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signUp = async (req, res) => {
  try {
    const { username, password, role, courseIds } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let initialStatus = 'Pending';
    if (role === 'Admin') {
       initialStatus = 'Approved'; // For testing purposes, auto-approve admins
    }

    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || 'Student',
      status: initialStatus,
      enrolledCourses: (courseIds && Array.isArray(courseIds)) ? courseIds : []
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully', user: { username, role: newUser.role, status: newUser.status } });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'Approved') {
      return res.status(403).json({ message: `Access denied. Account status is ${user.status}` });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, status: user.status },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({ message: 'Login successful', token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    // Since JWTs are stateless, true logout happens by deleting the token on the frontend.
    // We return a 200 OK so the frontend knows the request succeeded.
    res.status(200).json({ message: 'Logged out successfully. Please remove the token from your client.' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error: error.message });
  }
};

module.exports = { signUp, login, logout };
