import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PiggyBank } from "lucide-react";
import { IconChip } from "./icon-chip";

describe("IconChip", () => {
  it("renders the provided icon", () => {
    const { container } = render(<IconChip icon={PiggyBank} />);

    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("is hidden from assistive tech when no label is given", () => {
    const { container } = render(<IconChip icon={PiggyBank} />);

    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });

  it("exposes an accessible name when a label is given", () => {
    render(<IconChip icon={PiggyBank} label="Savings" />);

    expect(screen.getByRole("img", { name: "Savings" })).not.toBeNull();
  });
});
