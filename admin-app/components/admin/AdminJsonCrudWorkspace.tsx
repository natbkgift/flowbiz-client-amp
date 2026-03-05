"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  ADMIN_AUTH_LOGIN_PATH,
  clearAuthSession,
  fetchJson,
  type LoginResponse,
  persistAuthSession,
  readAuthSession,
  toPrettyJson,
} from "@/app/_lib/admin-auth";
import { AdminDataTable, type AdminDataTableColumn } from "@/components/admin/AdminDataTable";
import {
  AdminFormPrimitiveInput,
  type AdminFormPrimitiveField,
  initializePrimitiveValues,
  toPrimitivePayload,
  validatePrimitiveValues,
} from "@/components/admin/AdminFormPrimitives";

type ListResponse = {
  data?: unknown[];
  items?: unknown[];
  meta?: { page?: number; limit?: number; total?: number } | null;
};

type CrudConfig = {
  title: string;
  subtitle: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  identifierField: string;
  listPath: string;
  getPath: string;
  createPath?: string;
  patchPath?: string;
  publishPath?: string;
  unpublishPath?: string;
  deletePath?: string;
  defaultListQuery?: string;
  defaultCreatePayload?: string;
  defaultPatchPayload?: string;
  createFormFields?: AdminFormPrimitiveField[];
  patchFormFields?: AdminFormPrimitiveField[];
  queryHelp?: string;
};

function withIdentifier(pathTemplate: string, identifier: string): string {
  return pathTemplate.replace("{id}", encodeURIComponent(identifier.trim()));
}

function buildListPath(path: string, query: string): string {
  const normalized = query.trim();
  if (!normalized) return path;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}${normalized}`;
}

function pickString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

export function AdminJsonCrudWorkspace({ config }: { config: CrudConfig }) {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [listQuery, setListQuery] = useState(config.defaultListQuery || "");
  const [identifier, setIdentifier] = useState("");
  const [createPayload, setCreatePayload] = useState(config.defaultCreatePayload || "{}");
  const [patchPayload, setPatchPayload] = useState(config.defaultPatchPayload || "{}");
  const [createFormValues, setCreateFormValues] = useState<Record<string, string>>(() =>
    initializePrimitiveValues(config.createFormFields, config.defaultCreatePayload || "{}")
  );
  const [patchFormValues, setPatchFormValues] = useState<Record<string, string>>(() =>
    initializePrimitiveValues(config.patchFormFields, config.defaultPatchPayload || "{}")
  );
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});
  const [patchFormErrors, setPatchFormErrors] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<unknown[]>([]);
  const [meta, setMeta] = useState<ListResponse["meta"]>(null);
  const [result, setResult] = useState<string>("");

  useEffect(() => {
    const session = readAuthSession();
    if (!session) return;
    setToken(session.token);
    setEmail(session.email);
    if (session.email) setLoginEmail(session.email);
  }, []);

  const isAuthenticated = token.trim().length > 0;

  const listPath = useMemo(
    () => buildListPath(config.listPath, listQuery),
    [config.listPath, listQuery]
  );

  async function loadList(tokenOverride?: string): Promise<void> {
    const activeToken = (tokenOverride ?? token).trim();
    if (!activeToken) {
      setError("Sign in is required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const body = await fetchJson<ListResponse>(listPath, activeToken);
      const rows = Array.isArray(body.data)
        ? body.data
        : Array.isArray(body.items)
          ? body.items
          : [];
      setItems(rows);
      setMeta(body.meta || null);
      persistAuthSession(activeToken, email || loginEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextEmail = loginEmail.trim();
    const nextPassword = loginPassword;
    if (!nextEmail || !nextPassword) {
      setAuthError("Email and password are required.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(ADMIN_AUTH_LOGIN_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: nextEmail, password: nextPassword }),
      });
      if (!response.ok) {
        setAuthError(response.status === 401 ? "Invalid credentials." : "Unable to sign in.");
        return;
      }
      const body = (await response.json()) as LoginResponse;
      const accessToken = String(body.access_token || "").trim();
      if (!accessToken) {
        setAuthError("Unable to sign in.");
        return;
      }
      setToken(accessToken);
      setEmail(nextEmail);
      setLoginPassword("");
      persistAuthSession(accessToken, nextEmail);
      await loadList(accessToken);
    } catch {
      setAuthError("Unable to sign in.");
    } finally {
      setAuthLoading(false);
    }
  }

  function logout(): void {
    clearAuthSession();
    setToken("");
    setEmail("");
    setLoginPassword("");
    setAuthError(null);
    setError(null);
    setItems([]);
    setMeta(null);
    setResult("");
  }

  async function runAction(action: () => Promise<unknown>): Promise<void> {
    setError(null);
    try {
      const output = await action();
      setResult(toPrettyJson(output));
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    }
  }

  function parseJsonInput(input: string): unknown {
    return JSON.parse(input);
  }

  const pickIdentifierFromRow = useCallback((item: unknown): string => {
    if (!item || typeof item !== "object") return "";
    const row = item as Record<string, unknown>;
    return pickString(row, config.identifierField) || pickString(row, "id") || pickString(row, "slug");
  }, [config.identifierField]);

  const tableColumns = useMemo<AdminDataTableColumn<unknown>[]>(
    () => [
      {
        key: "use",
        label: "Use",
        renderCell: (item) => {
          const id = pickIdentifierFromRow(item);
          return (
            <button className="btn btn-secondary" type="button" onClick={() => setIdentifier(id)} disabled={!id}>
              Use
            </button>
          );
        },
        getSortValue: (item) => pickIdentifierFromRow(item),
        getFilterValue: (item) => pickIdentifierFromRow(item),
      },
      {
        key: "identifier",
        label: "Identifier",
        renderCell: (item) => {
          const id = pickIdentifierFromRow(item);
          return <code>{id || "-"}</code>;
        },
        getSortValue: (item) => pickIdentifierFromRow(item),
        getFilterValue: (item) => pickIdentifierFromRow(item),
      },
      {
        key: "slug",
        label: "Slug",
        renderCell: (item) => {
          if (!item || typeof item !== "object") return "-";
          return pickString(item as Record<string, unknown>, "slug") || "-";
        },
        getSortValue: (item) => (item && typeof item === "object" ? pickString(item as Record<string, unknown>, "slug") : ""),
        getFilterValue: (item) =>
          item && typeof item === "object" ? pickString(item as Record<string, unknown>, "slug") : "",
      },
      {
        key: "name",
        label: "Name/Title",
        renderCell: (item) => {
          if (!item || typeof item !== "object") return "-";
          const row = item as Record<string, unknown>;
          return pickString(row, "name") || pickString(row, "title") || pickString(row, "persona") || "-";
        },
        getSortValue: (item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as Record<string, unknown>;
          return pickString(row, "name") || pickString(row, "title") || pickString(row, "persona");
        },
        getFilterValue: (item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as Record<string, unknown>;
          return pickString(row, "name") || pickString(row, "title") || pickString(row, "persona");
        },
      },
      {
        key: "status",
        label: "Status/Updated",
        renderCell: (item) => {
          if (!item || typeof item !== "object") return "-";
          const row = item as Record<string, unknown>;
          const status = pickString(row, "status");
          const updatedAt =
            pickString(row, "updated_at") ||
            pickString(row, "created_at") ||
            pickString(row, "claims_updated_at");
          return status || updatedAt || "-";
        },
        getSortValue: (item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as Record<string, unknown>;
          return (
            pickString(row, "status") ||
            pickString(row, "updated_at") ||
            pickString(row, "created_at") ||
            pickString(row, "claims_updated_at")
          );
        },
        getFilterValue: (item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as Record<string, unknown>;
          return (
            pickString(row, "status") ||
            pickString(row, "updated_at") ||
            pickString(row, "created_at") ||
            pickString(row, "claims_updated_at")
          );
        },
      },
    ],
    [pickIdentifierFromRow]
  );

  return (
    <main id="main-content" className="container content-stack">
      <section className="card">
        <h1>{config.title}</h1>
        <p className="locale-safe">{config.subtitle}</p>
      </section>

      <section className="card dashboard-controls" aria-label="auth">
        {!isAuthenticated ? (
          <form className="crm-login-form" onSubmit={(event) => void login(event)}>
            <h2>Admin sign in</h2>
            <label className="field" htmlFor={`${config.title}-login-email`}>
              <span>Email</span>
              <input
                id={`${config.title}-login-email`}
                type="email"
                autoComplete="username"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>
            <label className="field" htmlFor={`${config.title}-login-password`}>
              <span>Password</span>
              <input
                id={`${config.title}-login-password`}
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </label>
            {authError ? <div className="state-error">{authError}</div> : null}
            <div className="card-actions">
              <button className="btn" type="submit" disabled={authLoading}>
                {authLoading ? "Signing in" : "Sign in"}
              </button>
            </div>
          </form>
        ) : (
          <div className="crm-session-panel" role="status">
            <p>{email ? `Signed in as ${email}` : "Signed in session active."}</p>
            <div className="card-actions">
              <button className="btn btn-secondary" type="button" onClick={() => void loadList()}>
                {loading ? "Loading" : "Refresh list"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={logout}>
                Sign out
              </button>
            </div>
          </div>
        )}
        {!isAuthenticated ? <div className="state-empty">Sign in to manage this workspace.</div> : null}
      </section>

      {isAuthenticated ? (
        <>
          <section className="card">
            <label className="field" htmlFor={`${config.title}-query`}>
              <span>List query</span>
              <input
                id={`${config.title}-query`}
                value={listQuery}
                onChange={(event) => setListQuery(event.target.value)}
                placeholder="page=1&limit=20"
              />
            </label>
            {config.queryHelp ? <p className="locale-safe">{config.queryHelp}</p> : null}
            <div className="card-actions">
              <button className="btn btn-secondary" type="button" onClick={() => void loadList()}>
                Load list
              </button>
            </div>
            {meta ? (
              <p className="locale-safe">
                page={meta.page ?? "-"} limit={meta.limit ?? "-"} total={meta.total ?? "-"}
              </p>
            ) : null}
          </section>

          <section className="card">
            <label className="field" htmlFor={`${config.title}-identifier`}>
              <span>{config.identifierLabel}</span>
              <input
                id={`${config.title}-identifier`}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={config.identifierPlaceholder}
              />
            </label>
            <div className="card-actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() =>
                  void runAction(() =>
                    fetchJson(withIdentifier(config.getPath, identifier), token.trim())
                  )
                }
                disabled={!identifier.trim()}
              >
                Get detail
              </button>
              {config.publishPath ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() =>
                    void runAction(() =>
                      fetchJson(withIdentifier(config.publishPath || "", identifier), token.trim(), {
                        method: "POST",
                      })
                    )
                  }
                  disabled={!identifier.trim()}
                >
                  Publish
                </button>
              ) : null}
              {config.unpublishPath ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() =>
                    void runAction(() =>
                      fetchJson(withIdentifier(config.unpublishPath || "", identifier), token.trim(), {
                        method: "POST",
                      })
                    )
                  }
                  disabled={!identifier.trim()}
                >
                  Unpublish
                </button>
              ) : null}
              {config.deletePath ? (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() =>
                    void runAction(() =>
                      fetchJson(withIdentifier(config.deletePath || "", identifier), token.trim(), {
                        method: "DELETE",
                      })
                    )
                  }
                  disabled={!identifier.trim()}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </section>

          {config.createPath ? (
            <section className="card">
              {Array.isArray(config.createFormFields) && config.createFormFields.length > 0 ? (
                <>
                  <h2>Create record</h2>
                  {config.createFormFields.map((field) => (
                    <AdminFormPrimitiveInput
                      key={field.name}
                      idPrefix={`${config.title}-create`}
                      field={field}
                      value={createFormValues[field.name] || ""}
                      error={createFormErrors[field.name]}
                      onChange={(name, value) => {
                        setCreateFormValues((current) => ({ ...current, [name]: value }));
                        setCreateFormErrors((current) => {
                          if (!current[name]) return current;
                          const next = { ...current };
                          delete next[name];
                          return next;
                        });
                      }}
                    />
                  ))}
                </>
              ) : (
                <label className="field" htmlFor={`${config.title}-create-json`}>
                  <span>Create payload JSON</span>
                  <textarea
                    id={`${config.title}-create-json`}
                    rows={10}
                    value={createPayload}
                    onChange={(event) => setCreatePayload(event.target.value)}
                  />
                </label>
              )}
              <div className="card-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={() =>
                    void runAction(() =>
                      fetchJson(config.createPath || "", token.trim(), {
                        method: "POST",
                        body: JSON.stringify(
                          Array.isArray(config.createFormFields) && config.createFormFields.length > 0
                            ? (() => {
                                const errors = validatePrimitiveValues(config.createFormFields || [], createFormValues);
                                setCreateFormErrors(errors);
                                if (Object.keys(errors).length > 0) {
                                  throw new Error(Object.values(errors)[0]);
                                }
                                return toPrimitivePayload(config.createFormFields || [], createFormValues);
                              })()
                            : parseJsonInput(createPayload)
                        ),
                      })
                    )
                  }
                >
                  Create
                </button>
              </div>
            </section>
          ) : null}

          {config.patchPath ? (
            <section className="card">
              {Array.isArray(config.patchFormFields) && config.patchFormFields.length > 0 ? (
                <>
                  <h2>Update record</h2>
                  {config.patchFormFields.map((field) => (
                    <AdminFormPrimitiveInput
                      key={field.name}
                      idPrefix={`${config.title}-patch`}
                      field={field}
                      value={patchFormValues[field.name] || ""}
                      error={patchFormErrors[field.name]}
                      onChange={(name, value) => {
                        setPatchFormValues((current) => ({ ...current, [name]: value }));
                        setPatchFormErrors((current) => {
                          if (!current[name]) return current;
                          const next = { ...current };
                          delete next[name];
                          return next;
                        });
                      }}
                    />
                  ))}
                </>
              ) : (
                <label className="field" htmlFor={`${config.title}-patch-json`}>
                  <span>Patch payload JSON</span>
                  <textarea
                    id={`${config.title}-patch-json`}
                    rows={10}
                    value={patchPayload}
                    onChange={(event) => setPatchPayload(event.target.value)}
                  />
                </label>
              )}
              <div className="card-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={!identifier.trim()}
                  onClick={() =>
                    void runAction(() =>
                      fetchJson(withIdentifier(config.patchPath || "", identifier), token.trim(), {
                        method: "PATCH",
                        body: JSON.stringify(
                          Array.isArray(config.patchFormFields) && config.patchFormFields.length > 0
                            ? (() => {
                                const errors = validatePrimitiveValues(config.patchFormFields || [], patchFormValues);
                                setPatchFormErrors(errors);
                                if (Object.keys(errors).length > 0) {
                                  throw new Error(Object.values(errors)[0]);
                                }
                                return toPrimitivePayload(config.patchFormFields || [], patchFormValues);
                              })()
                            : parseJsonInput(patchPayload)
                        ),
                      })
                    )
                  }
                >
                  Patch
                </button>
              </div>
            </section>
          ) : null}

          {error ? <div className="state-error">{error}</div> : null}
          {loading ? <div className="state-loading">Loading</div> : null}

          <section className="card">
            <h2>Records</h2>
            {items.length === 0 ? (
              <div className="state-empty">No records</div>
            ) : (
              <AdminDataTable
                rows={items}
                columns={tableColumns}
                getRowId={(item, index) => pickIdentifierFromRow(item) || `row-${index}`}
                emptyLabel="No records"
              />
            )}
          </section>

          {result ? (
            <section className="card">
              <h2>Result</h2>
              <pre>{result}</pre>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
