"use client";
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { buildPublicApiUrl } from '@/Utils/publicApi';
import { setUser } from '../Redux/userSlice'; // Import setUser action

const profileRequestsByToken = new Map();

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const fetchProfileWithToken = (token) => {
  const normalizedToken = typeof token === 'string' ? token.trim() : '';
  if (!normalizedToken) {
    return Promise.reject(Object.assign(new Error('Missing authentication token'), { status: 401 }));
  }

  const existingRequest = profileRequestsByToken.get(normalizedToken);
  if (existingRequest) return existingRequest;

  const request = fetch(buildPublicApiUrl('/profile'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${normalizedToken}`,
    },
  })
    .then(async (response) => {
      const data = await parseJsonResponse(response);
      if (!response.ok) {
        const error = new Error(data.message || 'Failed to fetch user data');
        error.status = response.status;
        throw error;
      }
      return data;
    })
    .finally(() => {
      profileRequestsByToken.delete(normalizedToken);
    });

  profileRequestsByToken.set(normalizedToken, request);
  return request;
};

const clearInvalidStoredToken = (status) => {
  if (![401, 403].includes(Number(status))) return;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('authToken');
  }
};

// Async thunk for logging in
export const loginUser = createAsyncThunk('auth/loginUser', async ({ email, password }, { dispatch, rejectWithValue }) => {
  try {
    const response = await fetch(buildPublicApiUrl('/login'), {
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

    // Fetch user data with token. Duplicate requests for the same token are shared.
    const token = data.token;
    const userData = await fetchProfileWithToken(token);

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
    const data = await fetchProfileWithToken(token);

    // Dispatch setUser action with user data
    dispatch(setUser(data.user));

    return data.user; // Returning user data
  } catch (error) {
    clearInvalidStoredToken(error?.status);
    return rejectWithValue({
      message: error?.message || 'Failed to fetch user data',
      status: Number(error?.status) || 0,
    });
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
        state.error = action.payload?.message || action.error?.message || 'Failed to fetch user data';
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
