#!/usr/bin/env node

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const databaseTarget = 'clipmanager';

const parseCollectionsArg = () => {
  const arg = process.argv.find((item) => item.startsWith('--collections='));
  if (!arg) return null;
  const value = arg.split('=')[1];
  if (!value) return null;
  return value.split(',').map((name) => name.trim()).filter(Boolean);
};

const parseDryRunArg = () => process.argv.includes('--dry-run');

const parseProjectIdArg = () => {
  const arg = process.argv.find((item) => item.startsWith('--projectId='));
  if (!arg) return null;
  return arg.split('=')[1] || null;
};

const getProjectIdFromFirebaseRc = () => {
  try {
    const rcPath = path.resolve(process.cwd(), '.firebaserc');
    if (!fs.existsSync(rcPath)) return null;
    const raw = fs.readFileSync(rcPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed?.projects?.default || null;
  } catch (err) {
    return null;
  }
};

const initAdmin = (projectId) => {
  if (admin.apps.length === 0) {
    if (!projectId) {
      throw new Error('Missing projectId. Provide --projectId or set it in .firebaserc.');
    }
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const credential = credentialsPath
      ? admin.credential.cert(require(credentialsPath))
      : admin.credential.applicationDefault();
    admin.initializeApp({
      projectId,
      credential
    });
  }
};

const copyDocWithSubcollections = async (sourceDocRef, targetDocRef, dryRun) => {
  const sourceSnap = await sourceDocRef.get();
  if (!sourceSnap.exists) return;

  if (!dryRun) {
    await targetDocRef.set(sourceSnap.data());
  }

  const subcollections = await sourceDocRef.listCollections();
  for (const subcollection of subcollections) {
    await copyCollection(subcollection, targetDocRef.collection(subcollection.id), dryRun);
  }
};

const copyCollection = async (sourceColRef, targetColRef, dryRun) => {
  const snapshot = await sourceColRef.get();
  if (snapshot.empty) return;

  const batches = [];
  let batch = targetColRef.firestore.batch();
  let opCount = 0;

  for (const docSnap of snapshot.docs) {
    const targetDocRef = targetColRef.doc(docSnap.id);
    if (!dryRun) {
      batch.set(targetDocRef, docSnap.data());
      opCount += 1;
    }

    if (opCount >= 450) {
      batches.push(batch.commit());
      batch = targetColRef.firestore.batch();
      opCount = 0;
    }
  }

  if (!dryRun && opCount > 0) {
    batches.push(batch.commit());
  }

  if (batches.length > 0) {
    await Promise.all(batches);
  }

  for (const docSnap of snapshot.docs) {
    await copyDocWithSubcollections(
      sourceColRef.doc(docSnap.id),
      targetColRef.doc(docSnap.id),
      dryRun
    );
  }
};

const copyDatabase = async () => {
  const collectionsFilter = parseCollectionsArg();
  const dryRun = parseDryRunArg();

  const projectId =
    parseProjectIdArg() ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    getProjectIdFromFirebaseRc();

  initAdmin(projectId);

  const sourceDb = getFirestore();
  const targetDb = getFirestore(admin.app(), databaseTarget);

  const rootCollections = await sourceDb.listCollections();
  const collectionsToCopy = collectionsFilter
    ? rootCollections.filter((col) => collectionsFilter.includes(col.id))
    : rootCollections;

  if (collectionsFilter && collectionsToCopy.length === 0) {
    console.error('No matching collections found in default database.');
    process.exit(1);
  }

  console.log(`Copying from default DB to ${databaseTarget} DB...`);
  if (collectionsFilter) {
    console.log(`Collections: ${collectionsToCopy.map((col) => col.id).join(', ')}`);
  }
  if (dryRun) {
    console.log('Dry run enabled: no data will be written.');
  }

  for (const collection of collectionsToCopy) {
    console.log(`→ Copying collection: ${collection.id}`);
    const targetCollection = targetDb.collection(collection.id);
    await copyCollection(collection, targetCollection, dryRun);
  }

  console.log('Copy completed.');
};

copyDatabase().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
