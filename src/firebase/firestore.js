// src/firebase/firestore.js
import firestore from '@react-native-firebase/firestore';
import {getDistance} from 'geolib';

const db = firestore();

const MAX_SUGGESTION_RADIUS_KM = 15;

// ─── Users ─────────────────────────────────────────────────
export const saveUserBase = (uid, data) =>
  db.collection('users').doc(uid).set(data, {merge: true});

export const getUserData = uid =>
  db.collection('users').doc(uid).get();

// Firebase Auth's sendPasswordResetEmail() deliberately resolves
// successfully regardless of whether the email is registered (an
// anti-enumeration security measure), so it can't tell us that on its own.
// This checks our own `users` collection instead, which we do control.
export const getUserByEmail = email =>
  db.collection('users').where('email', '==', email).limit(1).get();

export const updateUserData = (uid, data) =>
  db.collection('users').doc(uid).update(data);

// ─── Tutors ────────────────────────────────────────────────
export const saveTutorInfo = (uid, data) =>
  db.collection('tutors').doc(uid).set(data, {merge: true});

export const getTutorProfile = uid =>
  db.collection('tutors').doc(uid).get();

export const updateTutorProfile = (uid, data) =>
  db.collection('tutors').doc(uid).update(data);

// The "tutors" collection only stores tuition-specific info (qualification,
// subjects, address, bio, experience). The tutor's name/photo live in the
// "users" collection under the SAME uid. This helper merges the two so
// screens showing a tutor card always have a real name to display instead
// of falling back to the generic "Tutor" placeholder.
//
// If `studentLocation` ({latitude, longitude}) is provided, also attaches
// a `distanceKm` field to every tutor that has captured a location.
const attachUserInfoToTutors = async (tutorDocs, studentLocation) => {
  return Promise.all(
    tutorDocs.map(async d => {
      const tutorData = d.data();
      let userInfo = {};
      try {
        const userSnap = await db.collection('users').doc(d.id).get();
        if (userSnap.exists) {
          const {name, photoURL, email} = userSnap.data();
          userInfo = {name, photoURL, email};
        }
      } catch (_) {}

      let distanceKm;
      if (studentLocation && tutorData.location?.latitude != null) {
        distanceKm =
          getDistance(
            {latitude: studentLocation.latitude, longitude: studentLocation.longitude},
            {latitude: tutorData.location.latitude, longitude: tutorData.location.longitude},
          ) / 1000;
      }

      return {id: d.id, ...userInfo, ...tutorData, ...(distanceKm != null && {distanceKm})};
    }),
  );
};

export const getFeaturedTutors = async studentLocation => {
  const tutorSnap = await db.collection('tutors').limit(30).get();
  let merged = await attachUserInfoToTutors(tutorSnap.docs, studentLocation);

  if (studentLocation) {
    // Prefer tutors within the suggestion radius, nearest first.
    const nearby = merged
      .filter(t => t.distanceKm != null && t.distanceKm <= MAX_SUGGESTION_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Fall back to the full (unfiltered) list if nobody is nearby yet —
    // e.g. early on, before many tutors have captured their location.
    merged = nearby.length > 0 ? nearby : merged;
  }

  merged = merged.slice(0, 10);

  // Return the same {docs: [...]} shape the callers already expect
  // (each "doc" exposes .id and .data()).
  return {docs: merged.map(t => ({id: t.id, data: () => t}))};
};

export const getAllTutors = async () => {
  const tutorSnap = await db.collection('tutors').get();
  const merged = await attachUserInfoToTutors(tutorSnap.docs);
  return {docs: merged.map(t => ({id: t.id, data: () => t}))};
};

export const searchTutors = async (query, studentLocation) => {
  // Firestore doesn't support full-text search natively.
  // This fetches all and filters client-side (acceptable for small datasets).
  const snap = await db.collection('tutors').get();
  let merged = await attachUserInfoToTutors(snap.docs, studentLocation);

  const q = query.toLowerCase();
  if (q.trim()) {
    merged = merged.filter(
      t =>
        t.name?.toLowerCase().includes(q) ||
        t.subjects?.toLowerCase().includes(q) ||
        t.address?.toLowerCase().includes(q) ||
        t.qualification?.toLowerCase().includes(q),
    );
  }

  // Sort nearest-first when we know the student's location, but don't hard
  // filter — search is meant to be comprehensive, unlike the home screen's
  // "suggested nearby tutors" list.
  if (studentLocation) {
    merged = [...merged].sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  return merged;
};

// ─── Students ──────────────────────────────────────────────
export const saveStudentInfo = (uid, data) =>
  db.collection('students').doc(uid).set(data, {merge: true});

export const getStudentProfile = uid =>
  db.collection('students').doc(uid).get();

export const updateStudentProfile = (uid, data) =>
  db.collection('students').doc(uid).update(data);

// ─── Batches ───────────────────────────────────────────────
export const createBatch = (tutorId, batchData) =>
  db.collection('batches').add({
    tutorId,
    ...batchData,
    studentCount: 0,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

export const getTutorBatches = tutorId =>
  db.collection('batches').where('tutorId', '==', tutorId).get();

export const getAllBatches = () => db.collection('batches').get();

export const getBatchById = batchId =>
  db.collection('batches').doc(batchId).get();

export const updateBatch = (batchId, data) =>
  db.collection('batches').doc(batchId).update(data);

export const deleteBatch = batchId =>
  db.collection('batches').doc(batchId).delete();

// ─── Batch Students ────────────────────────────────────────
// Filtering by BOTH tutorId and batchId (not just batchId) matters here:
// the batchStudents security rule allows read only if
// resource.data.tutorId == request.auth.uid (or studentId, for students).
// For query/list reads, Firestore can only allow the request if it can
// prove from the query's own where() clauses that every possible result
// satisfies the rule — it can't just check the returned documents after
// running the query. A query filtered only by batchId can't be proven
// safe that way (even though every matching doc really does belong to
// this tutor), so it gets rejected outright with permission-denied.
// Filtering on tutorId === the caller's own uid makes it provable.
export const getBatchStudents = (tutorId, batchId) =>
  db
    .collection('batchStudents')
    .where('tutorId', '==', tutorId)
    .where('batchId', '==', batchId)
    .get();

export const getStudentBatches = studentId =>
  db.collection('batchStudents').where('studentId', '==', studentId).get();

export const addStudentToBatch = (batchId, studentData) =>
  db.collection('batchStudents').add({
    batchId,
    ...studentData,
    joinedAt: firestore.FieldValue.serverTimestamp(),
  });

export const removeStudentFromBatch = docId =>
  db.collection('batchStudents').doc(docId).delete();

export const incrementBatchStudentCount = (batchId, delta) =>
  db
    .collection('batches')
    .doc(batchId)
    .update({
      studentCount: firestore.FieldValue.increment(delta),
    });

// ─── Ratings & Reviews ─────────────────────────────────────
// A single flat "ratings" collection: one doc per (student, batch) pair.
// After every submit/update we recompute and store the average directly on
// the tutor's `tutors/{tutorId}` doc (as `rating` + `reviewCount`) so every
// screen that already reads the tutor profile (home, search, tutor's own
// profile preview) shows the real average with no extra queries needed.

export const getTutorRatings = tutorId =>
  db.collection('ratings').where('tutorId', '==', tutorId).get();

export const getStudentRatingForBatch = (studentId, batchId) =>
  db
    .collection('ratings')
    .where('studentId', '==', studentId)
    .where('batchId', '==', batchId)
    .limit(1)
    .get();

const recalculateTutorRating = async tutorId => {
  const snap = await db.collection('ratings').where('tutorId', '==', tutorId).get();
  const count = snap.size;
  const total = snap.docs.reduce((acc, d) => acc + (d.data().rating || 0), 0);
  const average = count > 0 ? total / count : 0;

  await db
    .collection('tutors')
    .doc(tutorId)
    .set(
      {
        rating: count > 0 ? Math.round(average * 10) / 10 : firestore.FieldValue.delete(),
        reviewCount: count,
      },
      {merge: true},
    );
};

// Creates a new rating, or updates the student's existing one for that
// batch (a student can only rate a given batch/tutor once). Either way the
// tutor's average is recalculated afterwards.
export const submitRating = async ({tutorId, studentId, batchId, batchName, rating, review}) => {
  const existing = await getStudentRatingForBatch(studentId, batchId);

  if (!existing.empty) {
    await existing.docs[0].ref.update({
      rating,
      review: review || '',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await db.collection('ratings').add({
      tutorId,
      studentId,
      batchId,
      batchName: batchName || '',
      rating,
      review: review || '',
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  await recalculateTutorRating(tutorId);
};