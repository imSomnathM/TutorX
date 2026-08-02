// src/firebase/storage.js
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';

// Upload profile photo and return download URL
export const uploadProfilePhoto = async localUri => {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const ref = storage().ref(`profilePhotos/${uid}.jpg`);
  await ref.putFile(localUri);
  return ref.getDownloadURL();
};

// Upload document (PDF/image) for tutor certificates
export const uploadDocument = async (localUri, fileName) => {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const ref = storage().ref(`tutorDocs/${uid}/${fileName}`);
  await ref.putFile(localUri);
  return ref.getDownloadURL();
};

// Delete a file from storage
export const deleteFile = async filePath => {
  return storage().ref(filePath).delete();
};
