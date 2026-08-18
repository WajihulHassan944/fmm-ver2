"use client";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { orderFightsForDisplay } from "@/Utils/fightOrdering";
import { fetchPublicFights, fetchPublicPredictionFights } from "@/Utils/publicApi";

// ✅ Fetch Matches for Redux (Client-Side)
export const fetchMatches = createAsyncThunk("matches/fetchMatches", async (query = {}) => {
  const usePredictionSource = Boolean(query?.predictionReady || query?.playableOnly);
  const fetcher = usePredictionSource ? fetchPublicPredictionFights : fetchPublicFights;
  const { predictionReady, playableOnly, ...requestQuery } = query || {};
  const data = await fetcher(requestQuery);
  return { rows: orderFightsForDisplay(data, { includeDrafts: Boolean(requestQuery?.includeDrafts) }), includeDrafts: Boolean(requestQuery?.includeDrafts) };
});

// ✅ Fetch Matches for getServerSideProps (Server-Side)
export const fetchMatchesSSR = async (query = {}) => {
  try {
    const data = await fetchPublicFights(query);
    return JSON.parse(JSON.stringify(orderFightsForDisplay(data, { includeDrafts: Boolean(query?.includeDrafts) })));
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
        state.data = orderFightsForDisplay(action.payload?.rows || action.payload || [], { includeDrafts: Boolean(action.payload?.includeDrafts) });
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default matchSlice.reducer;
