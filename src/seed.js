import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Chapter from './models/chapter.js';

dotenv.config();

// `npm run seed` — inserts sample data when the collection is empty.
// Safe to run repeatedly (skips when data already exists).
const sample = [
  { subject: 'Physics', chapter: 'Kinematics', class: 'Class 11', unit: 'Mechanics', yearWiseQuestionCount: { 2021: 4, 2022: 5, 2023: 6 }, questionSolved: 8, status: 'In Progress', isWeakChapter: true },
  { subject: 'Physics', chapter: 'Thermodynamics', class: 'Class 11', unit: 'Heat & Thermo', yearWiseQuestionCount: { 2021: 3, 2022: 4, 2023: 5 }, questionSolved: 12, status: 'Completed', isWeakChapter: false },
  { subject: 'Chemistry', chapter: 'Chemical Bonding', class: 'Class 11', unit: 'Physical Chemistry', yearWiseQuestionCount: { 2021: 5, 2022: 6, 2023: 7 }, questionSolved: 3, status: 'Not Started', isWeakChapter: true },
  { subject: 'Mathematics', chapter: 'Quadratic Equations', class: 'Class 11', unit: 'Algebra', yearWiseQuestionCount: { 2021: 2, 2022: 3, 2023: 4 }, questionSolved: 15, status: 'Completed', isWeakChapter: false },
  { subject: 'Mathematics', chapter: 'Probability', class: 'Class 12', unit: 'Statistics', yearWiseQuestionCount: { 2021: 6, 2022: 7, 2023: 8 }, questionSolved: 2, status: 'Not Started', isWeakChapter: true },
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set. Cannot seed.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const count = await Chapter.countDocuments();
  if (count > 0) {
    console.log(`Seed skipped: collection already has ${count} chapters.`);
  } else {
    await Chapter.insertMany(sample);
    console.log(`Seeded ${sample.length} sample chapters.`);
  }
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
