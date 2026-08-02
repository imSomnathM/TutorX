import React, {createContext, useContext, useEffect, useState} from 'react';
import auth from '@react-native-firebase/auth';
import {getUserData} from '../firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'student' | 'teacher'
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          const snap = await getUserData(firebaseUser.uid);

          if (snap.exists) {
            const data = snap.data();

            setRole(data.role || 'student');
            setProfileCompleted(data.profileCompleted === true);
            setUserData(data);
          } else {
            setRole(null);
            setUserData(null);
          }
        } else {
          setUser(null);
          setRole(null);
          setProfileCompleted(false);
          setUserData(null);
        }
      } catch (error) {
        console.log('AuthContext Error:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const refreshUserData = async () => {
    // Fall back to auth().currentUser in case this is called immediately
    // after sign-up/sign-in, before the `user` state has flowed through a
    // re-render (avoids a race where this becomes a no-op).
    const currentUser = user || auth().currentUser;
    if (!currentUser) return;

    const snap = await getUserData(currentUser.uid);

    if (snap.exists) {
      const data = snap.data();
      console.log("profileCompleted =", data.profileCompleted);
      setRole(data.role || 'student');
      setProfileCompleted(data.profileCompleted === true);
      setUserData(data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        userData,
        loading,
        profileCompleted,
        refreshUserData,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return ctx;
};