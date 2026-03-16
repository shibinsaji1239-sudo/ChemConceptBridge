const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');
const Exam = require('./models/Exam');

async function seedExams() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const admin = await User.findOne({ role: 'admin' });
    const teacher = await User.findOne({ role: 'teacher' });
    const students = await User.find({ role: 'student' });
    const studentIds = students.map(s => s._id);

    if (!admin || !teacher) {
      console.error('Core users (admin/teacher) missing for seeding.');
      process.exit(1);
    }

    const examsToCreate = [
      {
        title: "National Level Chemistry Olympiad (Admin Exam)",
        description: "Official annual exam for all advanced chemistry students.",
        topic: "Advanced Chemistry",
        durationMinutes: 120,
        totalMarks: 100,
        createdBy: admin._id,
        questions: [
          {
            type: 'mcq',
            text: "What is the oxidation state of Chromium in K2Cr2O7?",
            options: ["+2", "+4", "+6", "+7"],
            correctIndex: 2,
            marks: 5,
            section: 'A'
          },
          {
            type: 'numerical',
            text: "Calculate the molarity of a solution containing 4g of NaOH in 250ml of solution.",
            numericAnswer: 0.4,
            marks: 10,
            section: 'B'
          }
        ],
        assignedStudents: studentIds
      },
      {
        title: "Term 1 Chemistry Assessment (Teacher Exam)",
        description: "Assessment covering Thermodynamics and Atomic Structure.",
        topic: "General Chemistry",
        durationMinutes: 60,
        totalMarks: 50,
        createdBy: teacher._id,
        questions: [
          {
            type: 'descriptive',
            text: "State and explain the First Law of Thermodynamics.",
            keywords: ["energy", "created", "destroyed", "conservation"],
            marks: 10,
            section: 'A'
          },
          {
            type: 'mcq',
            text: "Which of the following is an intensive property?",
            options: ["Volume", "Mass", "Temperature", "Internal Energy"],
            correctIndex: 2,
            marks: 5,
            section: 'A'
          }
        ],
        assignedStudents: studentIds
      }
    ];

    for (const examData of examsToCreate) {
      const exam = new Exam(examData);
      await exam.save();
      console.log(`Created exam: ${exam.title} (CreatedBy: ${examData.createdBy})`);
    }

    console.log('Seeding complete.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding exams:', err);
    process.exit(1);
  }
}

seedExams();
