import { notFound } from "next/navigation";
import { isV2Enabled } from "../../../lib/v2/config";
import SapsaDashboardClient from "./SapsaDashboardClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "SAPSA V2 — área restrita" };

export default function SapsaV2Page() {
  if (!isV2Enabled()) notFound();
  return <SapsaDashboardClient />;
}
