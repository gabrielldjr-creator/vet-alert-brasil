from datetime import datetime, timedelta, timezone
import unittest

from backend.convergence import evaluate
from backend.integrity import IntegrityProcessor
from backend.institutional import aggregate, validate_extension

NOW = datetime(2026, 8, 22, tzinfo=timezone.utc)


def record(city, days=0, alert="Síndrome respiratória", source="pilot", suspicious=False):
    return {"createdAt": NOW - timedelta(days=days), "state": "SC", "municipality": city,
            "cityCode": hash(city) % 10000, "species": "Bovinos", "alertGroup": "Síndromes Clínicas",
            "alertType": alert, "severity": "Atenção", "cases": 2, "source": source,
            "integrity": {"suspicious": suspicious}}


class IntegrityTests(unittest.TestCase):
    @staticmethod
    def observation(city="A"):
        value = record(city)
        value.pop("integrity")
        return value

    def test_server_fields_cannot_be_forged_and_identity_is_rejected(self):
        processor = IntegrityProcessor(b"test-secret")
        for field in ("submissionId", "receivedAt", "integrity", "crmv", "cpf", "email", "authUid", "coordinates"):
            with self.assertRaises(ValueError): processor.process({**self.observation(), field: "forged"}, "transient", NOW)

    def test_sidecar_is_server_generated_without_transient_identity(self):
        sidecar = IntegrityProcessor(b"test-secret").process(self.observation(), "uid-or-ip-never-persisted", NOW)
        self.assertEqual(sidecar["receivedAt"], NOW.isoformat())
        self.assertEqual(sidecar["schemaVersion"], "vetalert-observation-1")
        self.assertNotIn("uid", str(sidecar).lower())
        self.assertEqual(sidecar["integrity"]["professionalEligibility"]["status"], "unverified")

    def test_duplicates_and_rate_bursts_are_flagged_not_deleted(self):
        processor = IntegrityProcessor(b"test-secret")
        first = processor.process(self.observation(), "same", NOW)
        second = processor.process(self.observation(), "same", NOW + timedelta(seconds=1))
        self.assertFalse(first["integrity"]["duplicateSuspicion"])
        self.assertTrue(second["integrity"]["duplicateSuspicion"])


class ConvergenceTests(unittest.TestCase):
    def test_isolated(self): self.assertEqual(evaluate([record("A")], as_of=NOW)[0]["classification"], "isolated")

    def test_duplicate_burst_does_not_converge(self):
        rows = [record("A")] + [record("A", suspicious=True) for _ in range(8)]
        result = evaluate(rows, as_of=NOW)[0]
        self.assertEqual(result["classification"], "isolated")
        self.assertEqual(result["suspiciousRecordsExcluded"], 8)

    def test_nearby_municipalities_emerge_and_cross_source_is_explained(self):
        rows = [record("A"), record("B", 1), record("C", 2, source="agro_retail")]
        result = evaluate(rows, as_of=NOW)[0]
        self.assertEqual(result["classification"], "emerging")
        self.assertTrue(result["crossSourceCorroboration"])

    def test_long_period_separation_does_not_converge(self):
        self.assertEqual(evaluate([record("A"), record("B", 60)], as_of=NOW)[0]["recordCount"], 1)

    def test_different_syndromes_do_not_converge(self):
        results = evaluate([record("A"), record("B", alert="Síndrome digestiva")], as_of=NOW)
        self.assertEqual([r["classification"] for r in results], ["isolated", "isolated"])

    def test_historical_records_without_integrity_are_accepted(self):
        old_shape = record("A"); old_shape.pop("integrity")
        self.assertEqual(evaluate([old_shape], as_of=NOW)[0]["classification"], "isolated")


class InstitutionalTests(unittest.TestCase):
    def test_extensions_deny_identity_and_require_approval(self):
        with self.assertRaises(ValueError): validate_extension({"key": "crmv", "type": "enum", "version": "1"})
        with self.assertRaises(ValueError): validate_extension({"key": "manejo", "type": "enum", "version": "1", "required": True})

    def test_export_is_aggregate_and_has_no_hidden_identifiers(self):
        rows = [record("A"), record("A"), record("A", source="agro_retail")]
        exported = aggregate(rows, evaluate(rows, as_of=NOW))
        text = str(exported).lower()
        for prohibited in ("submissionid", "contentdigest", "authuid", "firebaseuid"):
            self.assertNotIn(prohibited, text)
        self.assertEqual(exported["totalAcceptedObservations"], 3)


if __name__ == "__main__": unittest.main()
