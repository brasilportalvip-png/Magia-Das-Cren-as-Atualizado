import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    firebaseConfig.projectId ||
    "gen-lang-client-0138178639";

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      initialized = true;
      return;
    } catch (e) {
      console.warn("[FIREBASE_ADMIN] Cert auth failed, trying fallback:", e);
    }
  }

  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
    initialized = true;
  } catch {
    try {
      admin.initializeApp({ projectId });
      initialized = true;
    } catch {
      // Already initialized or fallback
    }
  }
}

export function getDb() {
  initFirebaseAdmin();
  const dbId =
    process.env.FIRESTORE_DATABASE_ID ||
    firebaseConfig.firestoreDatabaseId ||
    "(default)";

  return getFirestore(undefined, dbId);
}

export async function verifyAuthToken(req: any): Promise<admin.auth.DecodedIdToken | null> {
  initFirebaseAdmin();

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const parts = authHeader.trim().split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  const token = parts[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (err) {
    console.warn("[AUTH_VERIFY_FAILED] Token invalid or expired");
    return null;
  }
}

export { admin };
