import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './lib/firebase.ts';
import { seedCoursesIfEmpty } from './lib/seeder';

async function testConnection() {
  try {
    seedCoursesIfEmpty();
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
