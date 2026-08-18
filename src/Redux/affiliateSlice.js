"use client";
import { createSlice } from '@reduxjs/toolkit';

const affiliateSlice = createSlice({
  name: 'affiliate',
  initialState: {
    id: null,
    firstName: '',
    lastName: '',
    playerName: '',
    zipCode: '',
    email: '',
    phone: '',
    profileUrl: '',
    verified: false,
   },
  reducers: {
    setAffiliateUser: (state, action) => {
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
        profileUrl: '',
        verified: false,
       };
    },
  },
});

export const { setAffiliateUser, clearUser } = affiliateSlice.actions;
export default affiliateSlice.reducer;
