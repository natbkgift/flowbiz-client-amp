import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminWorkspaceErrorState from "@/components/admin/AdminWorkspaceErrorState";

describe("AdminWorkspaceErrorState", () => {
  it("renders title/detail and executes retry action", () => {
    const onAction = vi.fn();
    render(
      <AdminWorkspaceErrorState
        title="Workspace error"
        detail="Please retry."
        actionLabel="Retry"
        onAction={onAction}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Workspace error")).toBeInTheDocument();
    expect(screen.getByText("Please retry.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
