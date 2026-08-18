import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper'; // Import wrapper for SSR support
import matchReducer from './matchSlice';
import authReducer from './authSlice';
import userReducer from './userSlice';
import adminAuthReducer from './adminAuthSlice';
import affiliateAuthReducer from './affiliateAuthSlice';
import musicReducer from './musicSlice';

const makeStore = () =>
  configureStore({
    reducer: {
      matches: matchReducer, // Now supports SSR
      auth: authReducer,
      user: userReducer,
      adminAuth: adminAuthReducer,
      affiliateAuth: affiliateAuthReducer,
      music: musicReducer,
    },
  });

export const wrapper = createWrapper(makeStore); // Create wrapper for Next.js SSR
