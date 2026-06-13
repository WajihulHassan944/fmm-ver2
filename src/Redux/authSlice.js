"use client";
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setUser } from '../Redux/userSlice'; // Import setUser action

// Async thunk for logging in
export const loginUser = createAsyncThunk('auth/loginUser', async ({ email, password }, { dispatch, rejectWithValue }) => {
  try {
    const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Fetch user data with token
    const token = data.token;
    const userResponse = await fetch('https://fantasymmadness-game-server-three.vercel.app/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const userData = await userResponse.json();
    if (!userResponse.ok) {
      throw new Error(userData.message || 'Failed to fetch user data');
    }

    // Dispatch setUser action with user data
    dispatch(setUser(userData.user));

    // Return the data
    return {
      token,
      user: userData.user,
    };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Async thunk for fetching user data based on token
export const fetchUser = createAsyncThunk('auth/fetchUser', async (token, { dispatch, rejectWithValue }) => {
  try {
    const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user data');
    }

    // Dispatch setUser action with user data
    dispatch(setUser(data.user));

    return data.user; // Returning user data
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('authToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user.currentPlan !== 'None') {
          state.isAuthenticated = true; // Only set to true if the plan is not 'None'
        }
        localStorage.setItem('authToken', action.payload.token); // Store token in local storage
        state.user = action.payload.user; // Set user from action payload
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        if (action.payload.currentPlan !== 'None') {
          state.isAuthenticated = true; // Only set to true if the plan is not 'None'
        }
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
