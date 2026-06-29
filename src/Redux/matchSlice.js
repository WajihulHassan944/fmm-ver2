"use client";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { orderFightsForDisplay } from "@/Utils/fightOrdering";
import { fetchPublicFights } from "@/Utils/publicApi";

// ✅ Fetch Matches for Redux (Client-Side)
export const fetchMatches = createAsyncThunk("matches/fetchMatches", async (query = {}) => {
  const data = await fetchPublicFights(query);
  return orderFightsForDisplay(data);
});

// ✅ Fetch Matches for getServerSideProps (Server-Side)
export const fetchMatchesSSR = async (query = {}) => {
  try {
    const data = await fetchPublicFights(query);
    return JSON.parse(JSON.stringify(orderFightsForDisplay(data)));
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
        state.data = orderFightsForDisplay(action.payload);
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default matchSlice.reducer;
