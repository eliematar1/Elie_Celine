import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if (!token) {
    setLoading(false);
    return;
  }
  
  if (storedUser) {
    setUser(JSON.parse(storedUser));
    setLoading(false);
  }
  
  authApi
    .me()
    .then((res) => {
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    })
    .catch(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    })
    .finally(() => setLoading(false));
}, []);

const login = async (email, password) => {
  const { data } = await authApi.login(email, password);
  localStorage.setItem('token', data.token);
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  } else {
    const userData = await authApi.me();
    localStorage.setItem('user', JSON.stringify(userData.data));
    setUser(userData.data);
  }
  return data;
};

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasRole = (role) => user?.roles?.includes(role) ?? false;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
