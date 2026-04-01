import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, FirebaseUser, db, doc, getDoc, setDoc, serverTimestamp, onSnapshot } from '../firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, isAdmin: false });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const setOnlineStatus = async (uid: string, status: 'online' | 'away' | 'offline') => {
      try {
        const userRef = doc(db, 'users', uid);
        const profileRef = doc(db, 'profiles', uid);
        await setDoc(userRef, { isOnline: status }, { merge: true });
        await setDoc(profileRef, { isOnline: status }, { merge: true });
      } catch (error) {
        console.error("Error updating online status:", error);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const userData = {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous Artist',
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            role: 'user',
            avatarShape: 'square',
            photoShape: 'square',
            showOnlineStatus: true,
            isOnline: 'online',
            handle: `@${(user.displayName || 'artist').toLowerCase().replace(/\s+/g, '_')}_${user.uid.slice(0, 4)}`,
            bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            twitterUrl: '',
            instagramUrl: '',
            githubUrl: '',
            discordUrl: '',
            tumblrUrl: '',
            blueskyUrl: '',
            websiteUrl: ''
          };
          await setDoc(userRef, userData);
          
          // Create public profile
          const profileRef = doc(db, 'profiles', user.uid);
          const profileData = {
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            bio: userData.bio,
            role: userData.role,
            createdAt: userData.createdAt,
            followersCount: 0,
            followingCount: 0,
            avatarShape: 'square',
            photoShape: 'square',
            showOnlineStatus: true,
            isOnline: 'online',
            handle: userData.handle,
            twitterUrl: '',
            instagramUrl: '',
            githubUrl: '',
            discordUrl: '',
            tumblrUrl: '',
            blueskyUrl: '',
            websiteUrl: ''
          };
          await setDoc(profileRef, profileData);
        } else {
          // Set online status for existing user
          await setOnlineStatus(user.uid, 'online');

          const userData = userSnap.data();
          setIsAdmin(userData?.role === 'admin' || user.email === 'rrbeardsley@gmail.com');
          
          // Ensure profile exists
          const profileRef = doc(db, 'profiles', user.uid);
          const profileSnap = await getDoc(profileRef);
          if (!profileSnap.exists()) {
            const profileData = {
              displayName: userData.displayName,
              photoURL: userData.photoURL,
              bio: userData.bio || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
              role: userData.role || 'user',
              createdAt: userData.createdAt,
              followersCount: userData.followersCount || 0,
              followingCount: userData.followingCount || 0,
              avatarShape: userData.avatarShape || 'square',
              photoShape: userData.photoShape || 'square',
              showOnlineStatus: userData.showOnlineStatus ?? true,
              isOnline: true,
              handle: userData.handle || `@${(userData.displayName || 'artist').toLowerCase().replace(/\s+/g, '_')}_${user.uid.slice(0, 4)}`,
              twitterUrl: userData.twitterUrl || '',
              instagramUrl: userData.instagramUrl || '',
              githubUrl: userData.githubUrl || '',
              discordUrl: userData.discordUrl || '',
              tumblrUrl: userData.tumblrUrl || '',
              blueskyUrl: userData.blueskyUrl || '',
              websiteUrl: userData.websiteUrl || ''
            };
            await setDoc(profileRef, profileData);
          }
        }

        // Set up real-time listener for profile
        const profileRef = doc(db, 'profiles', user.uid);
        unsubscribeProfile = onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
            setProfile({ id: doc.id, ...doc.data() });
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to profile:", error);
          setLoading(false);
        });

      } else {
        const prevUser = user;
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        if (prevUser) {
          setOnlineStatus(prevUser.uid, 'offline');
        }
        setLoading(false);
      }
    });

    const handleUnload = () => {
      if (auth.currentUser) {
        setOnlineStatus(auth.currentUser.uid, 'offline');
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
