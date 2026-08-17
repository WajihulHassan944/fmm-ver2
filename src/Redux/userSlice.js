"use client";
import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    id: null,
    firstName: '',
    lastName: '',
    playerName: '',
    zipCode: '',
    email: '',
    phone: '',
    isNotificationsEnabled: false,
    hasSubmittedTestimonial: false,
    isSubscribed: false,
    isUSCitizen: false,
    isAgreed: false,
    profileUrl: '',
    currentPlan: 'None',
    freePlanExpiryDate: null,
    hasAvailedFreePlan: false,
    verified: false,
    tokens: '0', // Add tokens to the initial state
    skillTier: 'rookie',
    skillTierUpdatedAt: null,
    rollingPerformancePercentile: null,
    loginStreak: 0,
    streakExpiresAt: null,
    dailyRewardClaimedAt: null,
    streakSkipUnlockedAt: null,
  },
  reducers: {
    setUser: (state, action) => {
      return {
        ...state,
        ...action.payload, // Spread the user data into the state
      };
    },
    clearUser: (state) => {
      return {
        id: null,
        firstName: '',
        lastName: '',
        playerName: '',
        zipCode: '',
        email: '',
        phone: '',
        isNotificationsEnabled: false,
        isSubscribed: false,
        isUSCitizen: false,
        isAgreed: false,
        profileUrl: '',
        hasSubmittedTestimonial: false,
        currentPlan: 'None',
        freePlanExpiryDate: null,
        hasAvailedFreePlan: false,
        verified: false,
        tokens: '0', // Reset tokens to 0 when clearing user
        skillTier: 'rookie',
        skillTierUpdatedAt: null,
        rollingPerformancePercentile: null,
        loginStreak: 0,
        streakExpiresAt: null,
        dailyRewardClaimedAt: null,
        streakSkipUnlockedAt: null,
      };
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
