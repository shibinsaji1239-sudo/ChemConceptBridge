const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');
const Exam = require('./models/Exam');

async function assignExams() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGO_URI or MONGODB_URI not found in .env');
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const students = await User.find({ role: 'student' });
    const exams = await Exam.find({ isActive: true });
    
    console.log(`Found ${students.length} students and ${exams.length} active exams.`);
    
    if (students.length === 0) {
      console.log('No students found.');
      return;
    }
    
    const studentIds = students.map(s => s._id);
    let totalAssigned = 0;

    for (const exam of exams) {
      const currentAssigned = exam.assignedStudents || [];
      const currentIds = new Set(currentAssigned.map(id => id.toString()));
      
      let addedCount = 0;
      studentIds.forEach(id => {
        if (!currentIds.has(id.toString())) {
          exam.assignedStudents.push(id);
          addedCount++;
        }
      });
      
      if (addedCount > 0) {
        await exam.save();
        console.log(`Exam "${exam.title}" assigned to ${addedCount} new students.`);
        totalAssigned += addedCount;
      } else {
        console.log(`Exam "${exam.title}" already assigned to all students.`);
      }
    }
    
    console.log(`Finished. Total assignments: ${totalAssigned}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

assignExams();
