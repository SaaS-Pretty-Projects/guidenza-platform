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
    totalModules: 12
  },
  {
    title: "System Design Interview Prep",
    author: "Michael Chen",
    description: "A comprehensive guide to backend system design, scaling, and architectural choices for FAANG interviews.",
    price: 149,
    thumbnail: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    categories: ["Development", "Architecture", "Career"],
    totalModules: 15
  },
  {
    title: "The Indie Founder Playbook",
    author: "Sarah Jenks",
    description: "From idea to revenue: how to build, launch, and scale a profitable micro-SaaS as a solo developer.",
    price: 99,
    thumbnail: "https://images.pexels.com/photos/3194521/pexels-photo-3194521.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    categories: ["Business", "Startups", "Entrepreneurship"],
    totalModules: 8
  },
  {
    title: "Machine Learning with Python",
    author: "Dr. Alex Rivera",
    description: "Practical ML from scratch. Build intelligent features and dive deep into standard algorithms using Python.",
    price: 249,
    thumbnail: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    categories: ["Development", "Data Science", "Python"],
    totalModules: 20
  }
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
