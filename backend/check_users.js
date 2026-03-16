const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const teachers = await User.find({ role: 'teacher' });
    const students = await User.find({ role: 'student' });
    
    console.log('Teachers count:', teachers.length);
    teachers.forEach(t => console.log(`Teacher: ${t.name} (${t._id})`));
    
    console.log('Students count:', students.length);
    students.forEach(s => {
      console.log(`Student: ${s.name} (${s._id}), Assigned Teacher: ${s.assignedTeacher}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
