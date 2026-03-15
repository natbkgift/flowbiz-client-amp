from pathlib import Path


def test_b14_prod_compose_mounts_ops_logs_into_api_container() -> None:
    compose_path = Path(__file__).resolve().parents[1] / "docker-compose.prod.yml"
    compose = compose_path.read_text(encoding="utf-8")

    assert "/opt/flowbiz/clients/flowbiz-client-amp/ops/logs:/app/ops/logs:ro" in compose
