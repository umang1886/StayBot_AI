import { createContext, useState, useCallback } from "react";
import { client } from "../api/client.js";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

/** JWT is stored in React state only (no localStorage per security rules). */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [owner, setOwner] = useState(null);

  const login = useCallback((accessToken, ownerData) => {
    setToken(accessToken);
    setOwner(ownerData);
    // Inject into Axios default headers immediately
    client.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setOwner(null);
    delete client.defaults.headers.common["Authorization"];
  }, []);

  return (
    <AuthContext.Provider value={{ token, owner, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
