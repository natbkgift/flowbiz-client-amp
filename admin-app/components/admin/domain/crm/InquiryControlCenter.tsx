import { type FormEvent } from "react";

import type { InquiryCopy } from "@/components/admin/domain/crm/inquiries-copy";
import { AdminButton } from "@/components/admin/AdminPrimitives";

export function InquiryControlCenter({
  t,
  isAuthenticated,
  authEmail,
  loginEmail,
  loginPassword,
  authLoading,
  authError,
  onLoginEmailChange,
  onLoginPasswordChange,
  onLogin,
  onLogout,
}: {
  t: InquiryCopy;
  isAuthenticated: boolean;
  authEmail: string;
  loginEmail: string;
  loginPassword: string;
  authLoading: boolean;
  authError: string | null;
  onLoginEmailChange: (value: string) => void;
  onLoginPasswordChange: (value: string) => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onLogout: () => void;
}) {
  return (
    <div className="crm-auth-shell">
      {!isAuthenticated ? (
        <form className="crm-login-form" method="post" onSubmit={(event) => void onLogin(event)}>
          <label className="field" htmlFor="crm-login-email">
            <span>{t.email}</span>
            <input
              id="crm-login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={loginEmail}
              onChange={(event) => onLoginEmailChange(event.target.value)}
            />
          </label>

          <label className="field" htmlFor="crm-login-password">
            <span>{t.password}</span>
            <input
              id="crm-login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={loginPassword}
              onChange={(event) => onLoginPasswordChange(event.target.value)}
            />
          </label>

          {authError ? <div className="state-error">{authError}</div> : null}

          <div className="card-actions">
            <AdminButton variant="primary" icon="workspace" type="submit" disabled={authLoading}>
              {authLoading ? t.signingIn : t.signIn}
            </AdminButton>
          </div>
        </form>
      ) : (
        <div className="crm-session-panel" role="status" aria-live="polite">
          <div className="crm-session-panel__head">
            <div className="crm-session-panel__copy">
              <strong>{t.sessionActive}</strong>
              <p className="locale-safe">{authEmail ? `${t.sessionAs}: ${authEmail}` : t.sessionUnknown}</p>
              <p className="crm-row-meta">{t.sessionHint}</p>
            </div>
          </div>
          <dl className="crm-session-panel__meta">
            <div>
              <dt>{t.sessionRole}</dt>
              <dd>{authEmail ? "admin" : "-"}</dd>
            </div>
            <div>
              <dt>{t.sessionCoverage}</dt>
              <dd>{t.sessionCoverageValue}</dd>
            </div>
          </dl>
          <div className="crm-session-panel__quick-actions card-actions">
            <AdminButton variant="secondary" icon="x" type="button" onClick={onLogout}>
              {t.signOut}
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}
