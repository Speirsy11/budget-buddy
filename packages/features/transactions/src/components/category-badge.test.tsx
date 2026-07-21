import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategoryBadge } from "./category-badge";

describe("CategoryBadge", () => {
  it("shows an uncategorized fallback when no category is assigned", () => {
    render(<CategoryBadge />);

    expect(screen.getByText("Uncategorized")).not.toBeNull();
  });

  it("shows the category and its budget classification", () => {
    render(<CategoryBadge category="Food & Groceries" necessityType="need" />);

    expect(screen.getByText("Food & Groceries")).not.toBeNull();
    expect(screen.getByText("need")).not.toBeNull();
  });

  it("marks AI-suggested categories with a visible icon", () => {
    const { container } = render(
      <CategoryBadge category="Entertainment" isAiSuggested />
    );

    expect(screen.getByText("Entertainment")).not.toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
