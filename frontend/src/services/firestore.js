import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Firestore path: users/{uid}/tests/{testId}
function testsRef(uid) {
  return collection(db, 'users', uid, 'tests');
}

function testDocRef(uid, testId) {
  return doc(db, 'users', uid, 'tests', String(testId));
}

/**
 * Fetch all saved tests for a user, ordered by creation time.
 * Returns an array matching the shape used in localStorage.
 */
export async function fetchTests(uid) {
  const q = query(testsRef(uid), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data());
}

/**
 * Save (create or overwrite) a single test document.
 */
export async function saveTest(uid, test) {
  const data = {
    ...test,
    id: String(test.id),
    updatedAt: serverTimestamp(),
    createdAt: test.createdAt ?? serverTimestamp(),
  };
  await setDoc(testDocRef(uid, test.id), data);
}

/**
 * Rename an existing test.
 */
export async function renameTest(uid, testId, newName) {
  await updateDoc(testDocRef(uid, testId), {
    name: newName,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a single test document.
 */
export async function deleteTest(uid, testId) {
  await deleteDoc(testDocRef(uid, testId));
}
