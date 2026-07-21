import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SyncStatus } from "./sync-status";

describe("SyncStatus", () => {
  it("renders nothing while no sync has started", () => {
    const { container } = render(<SyncStatus status="idle" />);

    expect(container.firstChild).toBeNull();
  });

  it("tells the user when transactions are syncing", () => {
    render(<SyncStatus status="syncing" />);

    expect(screen.getByText("Syncing transactions...")).not.toBeNull();
  });

  it("shows the supplied error message", () => {
    render(<SyncStatus status="error" error="Bank connection expired." />);

    expect(screen.getByText("Bank connection expired.")).not.toBeNull();
  });

  it("summarizes changed transactions after a successful sync", () => {
    render(<SyncStatus status="success" added={2} modified={1} removed={3} />);

    expect(screen.getByText("Sync complete.")).not.toBeNull();
    expect(screen.getByText("+2 new")).not.toBeNull();
    expect(screen.getByText("1 updated")).not.toBeNull();
    expect(screen.getByText("3 removed")).not.toBeNull();
  });

  it("reports when a successful sync found no changes", () => {
    render(<SyncStatus status="success" />);

    expect(screen.getByText("No new transactions.")).not.toBeNull();
  });
});
