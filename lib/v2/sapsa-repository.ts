import { Timestamp } from "firebase-admin/firestore";
import { buildSapsaSummary } from "./aggregation";
import { getV2Policy } from "./config";
import { getAdminFirestore } from "./firebase-admin";
import { hmacDigest } from "./security";

export async function loadSapsaSummary() {
  const db = getAdminFirestore();
  const cutoff = Timestamp.fromMillis(Date.now() - 90 * 86400000);
  const snapshot = await db.collection("veterinaryObservationsV2").where("receivedAt", ">=", cutoff).limit(5000).get();
  const records = snapshot.docs.map((doc) => {
    const data = doc.data();
    return { receivedAt: data.receivedAt.toDate(), territory: data.territory, species: data.species, signalGroup: data.signalGroup, source: data.sourceChannel ?? data.source, qualityFlags: data.qualityFlags };
  });
  const policy = getV2Policy();
  return buildSapsaSummary(records, { minimumCell: policy.minimumAggregateCell, recurring: 2, emerging: 3, sustained: 5 });
}

export async function auditSapsaExport(authenticatedUid: string, rowCount: number) {
  const now = new Date();
  const policy = getV2Policy();
  await getAdminFirestore().collection("auditLogsV2").add({
    event: "aggregate.exported",
    actorDigest: hmacDigest(process.env.VETALERT_V2_INTEGRITY_SECRET ?? "", "sapsa-actor-v1", authenticatedUid),
    occurredAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromMillis(now.getTime() + policy.integrityRetentionDays * 86_400_000),
    schemaVersion: 2,
    outcome: "exported",
    rowCount,
  });
}
