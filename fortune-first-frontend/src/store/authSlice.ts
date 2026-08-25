import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api, { setAccessToken } from '@/lib/api';
import type { LoginCredentials } from '@/types';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'investment_head' | 'business_head' | 'super_admin';
  mustChangePassword: boolean;
  profilePictureUrl?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

interface LoginResponseData {
  accessToken: string;
  user: User;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const error = err as { response?: { data?: { message?: string } } };
  return error.response?.data?.message || fallback;
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', credentials);
      return res.data.data as LoginResponseData;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Login failed. Please check your credentials.'));
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me');
      return res.data.data as User;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to fetch current user'));
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Lets a profile-picture upload update the topbar/sidebar avatar
    // immediately, without waiting on a full fetchCurrentUser() round trip.
    setProfilePicture: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.profilePictureUrl = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponseData>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        setAccessToken(action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Login failed';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setProfilePicture } = authSlice.actions;
export default authSlice.reducer;