import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import api from '@/src/lib/api';
import type { User, LoginCredentials } from '@/src/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: Cookies.get('ff_token') || null,
  isAuthenticated: !!Cookies.get('ff_token'),
  loading: false,
  error: null,
};

// ── Thunks ──────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      // MOCK API CALL
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (credentials.email === 'test@example.com' && credentials.password === 'password123') {
        const token = 'mock_jwt_token_123';
        const user: User = {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          must_change_password: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        Cookies.set('ff_token', token, { expires: 7 });
        return { token, user };
      }
      return rejectWithValue('Invalid credentials. Use test@example.com / password123');
    } catch (error) {
      return rejectWithValue('Login failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      // MOCK API CALL
      await new Promise(resolve => setTimeout(resolve, 400));
      const token = Cookies.get('ff_token');
      
      if (token === 'mock_jwt_token_123') {
        return {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          must_change_password: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as User;
      }
      throw new Error('Invalid token');
    } catch (error: unknown) {
      Cookies.remove('ff_token');
      return rejectWithValue('Session expired');
    }
  }
);

// ── Slice ───────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      Cookies.remove('ff_token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
