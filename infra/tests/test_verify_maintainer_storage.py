"""Run only in the reviewed, secret-free Linux test tree, not on an operator host.

Stage this file, the unchanged verifier, and SYNTHETIC_VARS at their infra paths
as UID 65534 (directories 0555, files 0444); run this file as UID 65533.
The Azure function is the only mocked dependency. Bash executes the actual
verifier. A sourced function, rather than an executable shim, preserves noexec.
"""

import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unittest


SYNTHETIC_VARS = (
    "# SYNTHETIC TEST ONLY: no subscription, identity, credentials, or endpoints.\n"
    "MAINTAINER_SA=syntheticonlyv0\n"
    "RG=synthetic-only-rg\n"
    "MAINTAINER_TABLE=SyntheticOnlyMaintainerTable\n"
)

# Never delegates to a real az executable, including for unexpected arguments.
AZURE_SHIM = r"""
az() {
  printf '%s\0' "$@" >> "$V0_AZ_LOG"
  printf '\0' >> "$V0_AZ_LOG"
  case "$1 $2 $3" in
    "storage account show")
      case "$V0_AZ_CASE" in
        account_failure) return 70 ;;
        shared_key_enabled) printf 'true\n' ;;
        warning_crlf) printf 'pkg_resources synthetic warning\r\nfalse\r\n' ;;
        *) printf 'false\n' ;;
      esac ;;
    "storage table list")
      case "$V0_AZ_CASE" in list_failure|network_blocked) return 71 ;; esac ;;
    "storage table create")
      case "$V0_AZ_CASE" in create_exists|network_blocked) return 72 ;; esac ;;
    "storage entity insert")
      case "$V0_AZ_CASE" in insert_failure|network_blocked) return 73 ;; esac ;;
    "storage entity show")
      case "$V0_AZ_CASE" in read_failure|insert_failure|network_blocked) return 74 ;; esac ;;
    "storage entity delete")
      case "$V0_AZ_CASE" in cleanup_failure) return 75 ;; esac ;;
    *) return 97 ;;
  esac
  return 0
}
"""


class StorageVerificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Not a replacement for the outer sandbox's independently checked gates.
        if os.name != "posix" or os.geteuid() != 65533 or os.getegid() != 65533:
            raise RuntimeError("Requires the approved isolated test UID/GID 65533")
        cls.infra = Path(__file__).resolve().parents[1]
        cls.script = cls.infra / "verify-maintainer-storage.sh"
        variables = cls.infra / "azure-vars.sh"
        if variables.read_text(encoding="utf-8") != SYNTHETIC_VARS:
            raise RuntimeError("Refusing non-synthetic azure-vars.sh")
        for path in (cls.infra, cls.infra / "tests", cls.script, variables, Path(__file__)):
            info = path.lstat()
            if path.is_symlink() or info.st_uid != 65534 or info.st_mode & 0o222:
                raise RuntimeError(f"Source must be immutable to the test user: {path}")
        cls.source_hash = hashlib.sha256(cls.script.read_bytes()).hexdigest()

    def run_case(self, case, errors, message):
        with tempfile.TemporaryDirectory(prefix="v0-storage-", dir="/tmp") as directory:
            scratch = Path(directory)
            shim = scratch / "azure-shim.bash"
            log = scratch / "azure-calls.bin"
            shim.write_text(AZURE_SHIM, encoding="utf-8")
            log.touch()
            # Explicit environment: no host Azure settings, credentials or profiles.
            result = subprocess.run(
                ["/bin/bash", "--noprofile", "--norc", str(self.script)],
                cwd=scratch,
                env={
                    "PATH": "/usr/bin:/bin",
                    "HOME": str(scratch),
                    "LC_ALL": "C.UTF-8",
                    "BASH_ENV": str(shim),
                    "V0_AZ_CASE": case,
                    "V0_AZ_LOG": str(log),
                },
                stdin=subprocess.DEVNULL,
                capture_output=True,
                text=True,
                encoding="utf-8",
                timeout=20,
                check=False,
            )
            raw_calls = log.read_bytes()
            calls = [
                row.decode("utf-8").split("\0")
                for row in raw_calls.split(b"\0\0") if row
            ]
            # Actual subprocess evidence, never substituted verifier output/exit.
            print(json.dumps({
                "case": case, "verifier_sha256": self.source_hash,
                "argv": result.args, "exit_code": result.returncode,
                "stdout": result.stdout, "stderr": result.stderr, "azure_calls": calls,
            }), flush=True)
        self.assertEqual(hashlib.sha256(self.script.read_bytes()).hexdigest(), self.source_hash)
        self.assert_calls(calls, case)
        output = re.sub(r"\x1b\[[0-9;]*m", "", result.stdout)
        self.assertEqual(result.stderr, "")
        self.assertIn(message, output)
        if case == "cleanup_failure":
            for passed in (
                "allowSharedKeyAccess=false (AAD-only enforced)",
                "table list via AAD succeeded (network path open)",
                "probe entity write succeeded", "probe entity read-back succeeded",
            ):
                self.assertIn(passed, output)
        self.assertEqual(result.returncode, 1 if errors else 0, output)
        final_lines = [line for line in output.splitlines() if line.startswith("── RED:")
                       or line.startswith("── GREEN:")]
        self.assertEqual(len(final_lines), 1, output)
        if errors:
            self.assertIn(f"── RED: {errors} check(s) failed.", final_lines[0])
            self.assertNotIn("── GREEN:", output)
        else:
            self.assertTrue(final_lines[0].startswith("── GREEN:"), output)
            self.assertNotIn("── RED:", output)
            self.assertNotIn("✗", output)

    def assert_calls(self, calls, case):
        self.assertGreaterEqual(len(calls), 5)
        row_keys = [arg[7:] for arg in calls[3] if arg.startswith("RowKey=")]
        self.assertEqual(len(row_keys), 1, calls)
        row_key = row_keys[0]
        self.assertRegex(row_key, r"^probe-[0-9]+-[0-9]+$")
        account = ["--account-name", "syntheticonlyv0", "--auth-mode", "login"]
        entity = ["-t", "SyntheticOnlyMaintainerTable",
                  "--partition-key", "__healthcheck__", "--row-key", row_key]
        expected = [
            ["storage", "account", "show", "-n", "syntheticonlyv0",
             "-g", "synthetic-only-rg", "--query", "allowSharedKeyAccess", "-o", "tsv"],
            ["storage", "table", "list", *account, "-o", "none"],
            ["storage", "table", "create", "-n", "SyntheticOnlyMaintainerTable",
             *account, "-o", "none"],
            ["storage", "entity", "insert", *account, "-t", "SyntheticOnlyMaintainerTable",
             "-e", "PartitionKey=__healthcheck__", f"RowKey={row_key}", "probe=true",
             "-o", "none"],
            ["storage", "entity", "show", *account, *entity, "-o", "none"],
        ]
        if case not in {"read_failure", "insert_failure", "network_blocked"}:
            expected.append(["storage", "entity", "delete", *account, *entity,
                             "--if-match", "*", "-o", "none"])
        # Exact command equality also rejects shared-key auth, login, account/network
        # updates, extra calls and alternate rows; every data-plane call uses login.
        self.assertEqual(calls, expected)

    def test_cleanup_failure_is_red(self):
        self.run_case("cleanup_failure", 1, "probe cleanup failed")

    def test_all_success_is_green(self):
        self.run_case("success", 0, "probe entity cleaned up")

    def test_existing_outcomes_are_preserved(self):
        for case, errors, message in (
            ("shared_key_enabled", 1, "Shared key must stay OFF."),
            ("account_failure", 1, "Shared key must stay OFF."),
            ("list_failure", 1, "table list via AAD failed"),
            ("network_blocked", 3, "probe entity read-back failed"),
            ("insert_failure", 2, "probe entity write failed"),
            ("read_failure", 1, "probe entity read-back failed"),
            ("create_exists", 0, "probe entity cleaned up"),
            ("warning_crlf", 0, "allowSharedKeyAccess=false (AAD-only enforced)"),
        ):
            with self.subTest(case=case):
                self.run_case(case, errors, message)


if __name__ == "__main__":
    unittest.main(verbosity=2)
