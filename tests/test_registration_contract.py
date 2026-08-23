from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
VET = (ROOT / "app/alerta/novo/AlertFormClient.tsx").read_text()
AGRO = (ROOT / "app/agro-signals/new/AgroSignalFormClient.tsx").read_text()
DASHBOARD = (ROOT / "components/vet-panel/GlobalAlertsDashboard.tsx").read_text()
RULES = (ROOT / "firestore.rules").read_text()


class RegistrationContractTests(unittest.TestCase):
    def test_veterinary_required_fields_and_route_are_preserved(self):
        for check in (
            'if (!species)', 'if (!alertType)', 'if (!herdCount)',
            'if (!state)', 'if (!cityCode)', 'if (!severity)',
        ):
            self.assertIn(check, VET)
        self.assertIn('router.push("/global-alerts-dashboard")', VET)

    def test_both_intakes_keep_auth_and_alerts_direct_write(self):
        for source in (VET, AGRO):
            self.assertIn("signInAnonymously", source)
            self.assertIn('addDoc(collection(db, "alerts"), {', source)
            self.assertIn("serverTimestamp()", source)

    def test_mapa_notification_governance_copy_is_preserved(self):
        self.assertIn("Não substitui notificação oficial obrigatória", VET)
        self.assertIn("doenças de notificação obrigatória", VET)
        self.assertIn("não substituem fluxos oficiais", VET)

    def test_payload_core_and_nested_shapes_are_preserved(self):
        for field in (
            "createdAt:", "state,", "regionIBGE:", "municipality:", "cityCode:",
            "species,", "alertGroup,", "alertType,", "severity,", "cases:",
            "herdCount,", "arrival_context:", "context:", 'source: "pilot"',
        ):
            self.assertIn(field, VET)
        for field in (
            'source: "agro_retail"', 'signalType: "field_retail"', "retailSignal:",
        ):
            self.assertIn(field, AGRO)

    def test_dashboard_maps_old_and_new_documents_without_schema_gate(self):
        self.assertIn("...(docSnap.data() as AlertRecord)", DASHBOARD)
        self.assertNotIn("schemaVersion ===", DASHBOARD)

    def test_rules_preserve_authenticated_create_but_reserve_server_fields(self):
        self.assertIn("allow create: if request.auth != null", RULES)
        for field in ("submissionId", "receivedAt", "schemaVersion", "sourceChannel", "integrity"):
            self.assertIn(f"'{field}'", RULES)


if __name__ == "__main__":
    unittest.main()
