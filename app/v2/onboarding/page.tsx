import { notFound } from "next/navigation";
import AlertFormClientV2 from "./AlertFormClientV2";
import { getV2OfficialChannelUrl, isV2Enabled } from "../../../lib/v2/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "VetAlert V2 — piloto controlado" };

export default function VetAlertV2Page() {
  if (!isV2Enabled()) notFound();
  return <AlertFormClientV2 officialChannelUrl={getV2OfficialChannelUrl()} />;
}
