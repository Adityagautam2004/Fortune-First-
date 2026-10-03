import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api, { setAccessToken } from '@/lib/api';
import type { UserRole } from '@/lib/auth-routes';
import { clearSessionHint, setSessionHint } from '@/lib/session-hint';
import type { LoginCredentials } from '@/types';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  profilePictureUrl?: string | null;
}

// 'idle' — session not checked yet (e.g. right after a hard reload);
// 'checking' — /auth/me in flight; the other two are settled answers.
// AuthGuard waits for a settled answer before rendering any portal page.
export type SessionStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sessionStatus: SessionStatus;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  sessionStatus: 'idle',
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
      const data = res.data.data as LoginResponseData;
      setSessionHint(data.user.role);
      return data;
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
      const user = res.data.data as User;
      setSessionHint(user.role);
      return user;
    } catch (err) {
      clearSessionHint();
      return rejectWithValue(extractErrorMessage(err, 'Failed to fetch current user'));
    }
  }
);

// Always resolves: even if the server call fails (expired session, network),
// the local session is cleared so the user is never stuck half signed in.
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.error('Logout request failed; clearing local session anyway', err);
  } finally {
    setAccessToken(null);
    clearSessionHint();
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
        state.sessionStatus = 'authenticated';
        state.user = action.payload.user;
        setAccessToken(action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Login failed';
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.sessionStatus = 'checking';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isAuthenticated = true;
        state.sessionStatus = 'authenticated';
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isAuthenticated = false;
        state.sessionStatus = 'unauthenticated';
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.sessionStatus = 'unauthenticated';
      });
  },
});

export const { clearError, setProfilePicture } = authSlice.actions;
export default authSlice.reducer;