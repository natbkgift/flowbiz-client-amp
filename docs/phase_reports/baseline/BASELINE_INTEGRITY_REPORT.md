# BASELINE INTEGRITY REPORT

## Git
- head: `b35bfb5b36d35005f73a7853b0fa52a70c3f6964`
- branch: `main`
- status_porcelain_lines: `1`
- diff_vs_origin_main_lines: `0`

## Snapshot Hashes
| Artifact | SHA256 |
|---|---|
| api_contract_snapshot.json | `26371da8a3885f7f8b97a5513b5827e5a5901c58e18adb40998d5493cd55964b` |
| cache_key_map.json | `98c4dd41ce4655bbb11986388f7130004695bf4cc66814d573e8d641af43296b` |
| crm_payload_snapshot.json | `f94329dacaf0ef223c28bd0d3666861635e8ac2eca500181aea46686ba5c7328` |
| db_schema_snapshot.json | `2700f905506df7ded1afef1ca59d9b6035995a6d9c559fc5de97560c3fd84ac4` |
| git_state.json | `7fa90e99f1a3f200544e00f1ae483d3b0c5f6037f9ba1650a663bc6442ece253` |
| metric_baseline_state.json | `c36548b2d6df7210af096cf00768c321063c4f8fe4726707c65cc5030359144b` |
| observability_readiness.json | `a908de839687b0b59a6b52c8d0bb63e41326ebeebba08eea4a2fdbb737b54083` |
| regression_surface_map.json | `3fe431ed4af6f07a6da6acb3658b89deeed13bca8e945ecf8d5423ce702afe60` |
| route_signature.json | `2349528603987b27ab90e3b34158f08173c1110bfd8606a0d8c9991a9247fbb5` |
| seo_metadata_snapshot.json | `359386c9940be7e96c3b52b81f70233aac09296b453d5b7d1fdd11d23208ad6a` |
| structured_data_snapshot.json | `9a8459da971c4fac80f01a00e0e1590c51fee4464fc207e6f86ca4517e7e0325` |

## Regression Surface
- alembic_revision_count: `21`
- api_endpoint_count: `72`
- api_sources: `['apps/api/routes/admin.py', 'apps/api/routes/admin_analytics_v2.py', 'apps/api/routes/admin_crm.py', 'apps/api/routes/admin_domain.py', 'apps/api/routes/admin_marketplace.py', 'apps/api/routes/admin_properties.py', 'apps/api/routes/admin_rbac.py', 'apps/api/routes/admin_seller.py', 'apps/api/routes/auth_me.py', 'apps/api/routes/health.py', 'apps/api/routes/v1/analytics.py', 'apps/api/routes/v1/auth.py', 'apps/api/routes/v1/compare.py', 'apps/api/routes/v1/crm.py', 'apps/api/routes/v1/domain.py', 'apps/api/routes/v1/investment.py', 'apps/api/routes/v1/marketplace.py', 'apps/api/routes/v1/members.py', 'apps/api/routes/v1/meta.py', 'apps/api/routes/v1/phase1.py', 'apps/api/routes/v1/projects.py', 'apps/api/routes/v1/properties.py', 'apps/api/routes/v1/seller.py']`
- next_roots: `['next:admin-app']`
- web_route_count: `25`

## Notes
- Repo-only snapshot (no live staging/production access, no DB connection).
- Production deploy gate requiring runtime logs/traces/alerts must be validated in target environment.
