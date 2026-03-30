import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, FirebaseUser, db, doc, getDoc, setDoc, serverTimestamp } from '../firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous Artist',
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            role: 'user'
          });
        } else {
          // Check for admin role
          const userData = userSnap.data();
          setIsAdmin(userData?.role === 'admin' || user.email === 'rrbeardsley@gmail.com');
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
