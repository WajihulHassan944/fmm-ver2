"use client";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ✅ Fetch Matches for Redux (Client-Side)
export const fetchMatches = createAsyncThunk("matches/fetchMatches", async () => {
  const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/match");
  return response.json();
});

// ✅ Fetch Matches for getServerSideProps (Server-Side)
export const fetchMatchesSSR = async () => {
  try {
    const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/match");

    if (!response.ok) {
      throw new Error(`Error ${response.status}: Failed to fetch matches`);
    }

    const data = await response.json();
    
    // Only return JSON serializable data
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Error fetching matches (SSR):", error);
    return [];
  }
};

// Redux slice for client-side state management
const matchSlice = createSlice({
  name: "matches",
  initialState: {
    data: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default matchSlice.reducer;
