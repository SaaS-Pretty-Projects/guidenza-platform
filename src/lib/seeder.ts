import { db } from '../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const SAMPLE_COURSES = [
  {
    title: "Advanced React Patterns",
    author: "Elena Rodriguez",
    description: "Master modern React architecture, custom hooks, and performance optimization techniques for large-scale applications.",
    price: 199,
    thumbnail: "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    categories: ["Development", "React", "Frontend"],
    totalModules: 8,
    modules: [
      { id: 'mod-1', title: 'Introduction & Project Setup' },
      { id: 'mod-2', title: 'Component Composition Patterns' },
      { id: 'mod-3', title: 'Custom Hooks in Depth' },
      { id: 'mod-4', title: 'Context & State Architecture' },
      { id: 'mod-5', title: 'Performance Optimization' },
      { id: 'mod-6', title: 'Testing React Components' },
      { id: 'mod-7', title: 'Code Splitting & Lazy Loading' },
      { id: 'mod-8', title: 'Capstone: Refactor a Real App' },
    ],
  },
  {
    title: "System Design Interview Prep",
    author: "Michael Chen",
    description: "A comprehensive guide to backend system design, scaling, and architectural choices for FAANG interviews.",
    price: 149,
    thumbnail: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    categories: ["Development", "Architecture", "Career"],
    totalModules: 8,
    modules: [
      { id: 'mod-1', title: 'System Design Fundamentals' },
      { id: 'mod-2', title: 'Scaling & Load Balancing' },
      { id: 'mod-3', title: 'Database Design & Sharding' },
      { id: 'mod-4', title: 'Caching Strategies' },
      { id: 'mod-5', title: 'Message Queues & Async Systems' },
      { id: 'mod-6', title: 'Microservices vs Monoliths' },
      { id: 'mod-7', title: 'Real-World Case Studies' },
      { id: 'mod-8', title: 'Mock Interview Walkthroughs' },
    ],
  },
  {
    title: "The Indie Founder Playbook",
    author: "Sarah Jenks",
    description: "From idea to revenue: how to build, launch, and scale a profitable micro-SaaS as a solo developer.",
    price: 99,
    thumbnail: "https://images.pexels.com/photos/3194521/pexels-photo-3194521.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    categories: ["Business", "Startups", "Entrepreneurship"],
    totalModules: 8,
    modules: [
      { id: 'mod-1', title: 'Finding a Profitable Niche' },
      { id: 'mod-2', title: 'Validating Before You Build' },
      { id: 'mod-3', title: 'MVP in a Weekend' },
      { id: 'mod-4', title: 'Landing Page & Early Access' },
      { id: 'mod-5', title: 'Pricing Strategy' },
      { id: 'mod-6', title: 'Distribution & Marketing' },
      { id: 'mod-7', title: 'Customer Support at Scale' },
      { id: 'mod-8', title: 'From $1K to $10K MRR' },
    ],
  },
  {
    title: "Machine Learning with Python",
    author: "Dr. Alex Rivera",
    description: "Practical ML from scratch. Build intelligent features and dive deep into standard algorithms using Python.",
    price: 249,
    thumbnail: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    categories: ["Development", "Data Science", "Python"],
    totalModules: 8,
    modules: [
      { id: 'mod-1', title: 'Python for Data Science' },
      { id: 'mod-2', title: 'NumPy & Pandas Essentials' },
      { id: 'mod-3', title: 'Supervised Learning Algorithms' },
      { id: 'mod-4', title: 'Model Evaluation & Tuning' },
      { id: 'mod-5', title: 'Unsupervised Learning' },
      { id: 'mod-6', title: 'Neural Networks from Scratch' },
      { id: 'mod-7', title: 'Feature Engineering in Practice' },
      { id: 'mod-8', title: 'Deploying ML Models' },
    ],
  },
];

export async function seedCoursesIfEmpty() {
  try {
    const q = collection(db, 'courses');
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log('Seeding courses...');
      for (const course of SAMPLE_COURSES) {
        await addDoc(collection(db, 'courses'), course);
      }
      console.log('Courses seeded successfully!');
    }
  } catch (err) {
    console.error('Failed to seed courses:', err);
  }
}
