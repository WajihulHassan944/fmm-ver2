"use client";
import { createSlice } from '@reduxjs/toolkit';

const musicSlice = createSlice({
  name: 'music',
  initialState: {
    isPlaying: true,
    seekPosition: 0, // Track the seek position
  },
  reducers: {
    stopMusic: (state, action) => {
      state.isPlaying = false;
      state.seekPosition = action.payload; // Save the seek position when stopping
    },
    playMusic: (state) => {
      state.isPlaying = true;
     
      // Ensure seekPosition remains unchanged to resume from the correct point
    },
    togglePlay: (state) => {
      state.isPlaying = !state.isPlaying; // Toggle the playing state
    },
    setSeekPosition: (state, action) => {
      state.seekPosition = action.payload; // Update seek position manually if needed
    },
    resetSeekPosition: (state) => {
      state.seekPosition = 0; // Reset seek position to the start
    },
  },
});

export const { stopMusic, playMusic, togglePlay, setSeekPosition, resetSeekPosition } = musicSlice.actions;
export default musicSlice.reducer;
