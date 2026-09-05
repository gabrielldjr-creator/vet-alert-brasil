import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getV2Policy } from "./config";
import { getAdminFirestore } from "./firebase-admin";
import { buildObservationDocument, type VeterinaryObservationV2Input } from "./schema";
import { hmacDigest, stableFingerprint } from "./security";

export async function persistObservationV2(input: VeterinaryObservationV2Input, authenticatedUid: string) {
  const secret = process.env.VETALERT_V2_INTEGRITY_SECRET ?? "";
  const policy = getV2Policy();
  const now = new Date();
  const receivedAt = Timestamp.fromDate(now);
  const observationExpiresAt = Timestamp.fromMillis(now.getTime() + policy.observationRetentionDays * 86400000);
  const integrityExpiresAt = Timestamp.fromMillis(now.getTime() + policy.integrityRetentionDays * 86400000);
  const submissionId = randomUUID();
  const originDigest = hmacDigest(secret, "origin-v1", authenticatedUid);
  const fingerprint = hmacDigest(secret, "observation-v1", stableFingerprint(input));
  const db = getAdminFirestore();

  return db.runTransaction(async (transaction) => {
    const integrity = db.collection("submissionIntegrityV2");
    const [originSnapshot, duplicateSnapshot] = await Promise.all([
      transaction.get(integrity.where("originDigest", "==", originDigest).limit(100)),
      transaction.get(integrity.where("fingerprint", "==", fingerprint).limit(100)),
    ]);
    const rateCutoff = now.getTime() - policy.rateWindowMinutes * 60000;
    const duplicateCutoff = now.getTime() - policy.duplicateWindowHours * 3600000;
    const recentFromOrigin = originSnapshot.docs.filter((doc) => doc.get("receivedAt")?.toMillis?.() >= rateCutoff).length;
    const duplicateSuspected = duplicateSnapshot.docs.some((doc) => doc.get("receivedAt")?.toMillis?.() >= duplicateCutoff);
    const rateLimitExceeded = recentFromOrigin >= policy.maxSubmissionsPerWindow;
    const observation = buildObservationDocument(input, { submissionId, receivedAt, expiresAt: observationExpiresAt, duplicateSuspected, rateLimitExceeded });

    transaction.create(db.collection("veterinaryObservationsV2").doc(submissionId), observation);
    transaction.create(integrity.doc(submissionId), { submissionId, originDigest, fingerprint, receivedAt, expiresAt: integrityExpiresAt, duplicateSuspected, rateLimitExceeded, policyVersion: "integrity-v2-1" });
    transaction.create(db.collection("auditLogsV2").doc(), { event: "observation.accepted", submissionId, actorDigest: originDigest, occurredAt: receivedAt, expiresAt: integrityExpiresAt, schemaVersion: 2, outcome: duplicateSuspected || rateLimitExceeded ? "accepted_for_review" : "accepted" });
    return { submissionId, accepted: true, reviewRequired: duplicateSuspected || rateLimitExceeded };
  });
}
