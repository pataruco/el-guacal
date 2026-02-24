import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: 'PLACEHOLDER',
  appId: 'PLACEHOLDER',
  authDomain: 'el-guacal.firebaseapp.com',
  messagingSenderId: 'PLACEHOLDER',
  projectId: 'el-guacal',
  storageBucket: 'el-guacal.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
