import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const role = localStorage.getItem('userRole');
        const name = localStorage.getItem('name');
        const userId = localStorage.getItem('userId');
        setUser({ ...decoded, role, name, userId });
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const login = (token, role, name, userId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('name', name);
    localStorage.setItem('userId', userId);
    const decoded = jwtDecode(token);
    setUser({ ...decoded, role, name, userId });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
