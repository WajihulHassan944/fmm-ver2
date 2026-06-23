
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { setAffiliateUser } from '../Redux/affiliateSlice'; 

// Async thunk for logging in
export const loginAffiliate = createAsyncThunk('authAffiliate/loginAffiliate', async ({ email, password }, { dispatch, rejectWithValue }) => {
  try {
    const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/loginAffiliate', {
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
    const userResponse = await fetch('https://fantasymmadness-game-server-three.vercel.app/profileAffiliate', {
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

    dispatch(setAffiliateUser(userData.user));

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
export const fetchAffiliate = createAsyncThunk('authAffiliate/fetchAffiliate', async (token, { dispatch, rejectWithValue }) => {
  try {
    const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/profileAffiliate', {
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

    dispatch(setAffiliateUser(data.user));
    console.log(data.user);
    return data.user; // Returning user data


  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const initialState = {
  isAuthenticatedAffiliate: typeof window !== "undefined" && !!localStorage.getItem('affiliateAuthToken'), // Initialize based on localStorage
  loading: false,
  userAffiliate: null,
  error: null,
};


const affiliateAuthSlice = createSlice({
  name: 'authAffiliate',
  initialState,
  reducers: {
    logoutAffiliate: (state) => {
      state.userAffiliate = null;
      state.isAuthenticatedAffiliate = false;
      localStorage.removeItem('affiliateAuthToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAffiliate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAffiliate.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.verified) {
            state.isAuthenticatedAffiliate = true; // Only set to true if the user is verified
        }
        localStorage.setItem('affiliateAuthToken', action.payload.token); // Store token in local storage
        state.userAffiliate = action.payload.user; // Set user from action payload
    
        console.log('isAuthenticatedAffiliate:', state.isAuthenticatedAffiliate); // Console log the value
    })

    .addCase(loginAffiliate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAffiliate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      
      .addCase(fetchAffiliate.fulfilled, (state, action) => {
        state.loading = false;
        state.userAffiliate = action.payload;
        if (action.payload.verified) {
            state.isAuthenticatedAffiliate = true; // Only set to true if the user is verified
        }
        
        console.log('isAuthenticatedAffiliate:', state.isAuthenticatedAffiliate); // Console log the value
    })
    
      .addCase(fetchAffiliate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticatedAffiliate = false;
        state.userAffiliate = null;
      });
  },
});

export const { logoutAffiliate } = affiliateAuthSlice.actions;
export default affiliateAuthSlice.reducer;
