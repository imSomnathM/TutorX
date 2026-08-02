// src/firebase/auth.js
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '368431942162-4dfp70n8n47cv0gh00rmrgtubqrf1pph.apps.googleusercontent.com',
});

// ─── Sign Up ───────────────────────────────────────────────
export const signUpWithEmail = async (name, email, password) => {
  const userCred = await auth().createUserWithEmailAndPassword(email, password);
  await userCred.user.updateProfile({displayName: name});
  return userCred.user;
};

// ─── Sign In ───────────────────────────────────────────────
export const signInWithEmail = (email, password) =>
  auth().signInWithEmailAndPassword(email, password);

// ─── Google ────────────────────────────────────────────────
export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
  const userInfo = await GoogleSignin.signIn();
  const googleCredential = auth.GoogleAuthProvider.credential(
    userInfo.data?.idToken || userInfo.idToken,
  );
  return auth().signInWithCredential(googleCredential);
};

// ─── Password Reset ────────────────────────────────────────
export const sendPasswordResetEmail = email =>
  auth().sendPasswordResetEmail(email);

export const updateUserPassword = async newPassword => {
  const user = auth().currentUser;
  if (!user) throw new Error('No user logged in');
  await user.updatePassword(newPassword);
};

export const reauthenticate = async currentPassword => {
  const user = auth().currentUser;
  const cred = auth.EmailAuthProvider.credential(user.email, currentPassword);
  return user.reauthenticateWithCredential(cred);
};

// ─── Sign Out ──────────────────────────────────────────────
export const signOut = async () => {
  try {
    await GoogleSignin.signOut();
  } catch (_) {}
  return auth().signOut();
};

// ─── Delete Account ────────────────────────────────────────
export const deleteAccount = () => auth().currentUser?.delete();

// ─── Get current user ──────────────────────────────────────
export const getCurrentUser = () => auth().currentUser;
