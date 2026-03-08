type AdminWorkspaceErrorStateProps = {
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void | Promise<void>;
  actionDisabled?: boolean;
};

export default function AdminWorkspaceErrorState({
  title,
  detail,
  actionLabel,
  onAction,
  actionDisabled = false,
}: AdminWorkspaceErrorStateProps) {
  return (
    <section className="state-error admin-workspace-error" role="alert" data-testid="admin-workspace-error">
      <h3 className="admin-workspace-error-title">{title}</h3>
      <p className="admin-workspace-error-detail locale-safe">{detail}</p>
      <div className="card-actions">
        <button className="btn btn-secondary" type="button" onClick={() => void onAction()} disabled={actionDisabled}>
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
