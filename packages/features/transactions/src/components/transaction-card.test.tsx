import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransactionCard } from "./transaction-card";

const baseTransaction = {
  id: "tx-1",
  date: new Date("2026-05-14T12:00:00Z"),
  description: "Weekly food shop",
  merchant: "Tesco",
  amount: -64.5,
  category: {
    name: "Food & Groceries",
    necessityType: "need" as const,
  },
};

describe("TransactionCard", () => {
  it("shows transaction details with an expense sign", () => {
    render(<TransactionCard transaction={baseTransaction} />);

    expect(screen.getByText("Weekly food shop")).not.toBeNull();
    expect(screen.getByText("Tesco")).not.toBeNull();
    expect(screen.getByText("Food & Groceries")).not.toBeNull();
    expect(screen.getByText("need")).not.toBeNull();
    expect(screen.getByText("-£64.50")).not.toBeNull();
  });

  it("shows income with a positive sign", () => {
    render(
      <TransactionCard
        transaction={{
          ...baseTransaction,
          description: "Salary",
          merchant: null,
          amount: 4200,
          category: null,
          aiClassified: "Income",
        }}
      />
    );

    expect(screen.getByText("+£4,200.00")).not.toBeNull();
    expect(screen.getByText("Income")).not.toBeNull();
  });

  it("notifies the consumer when the card is selected", () => {
    const onClick = vi.fn();
    const { container } = render(
      <TransactionCard transaction={baseTransaction} onClick={onClick} />
    );

    const card = container.firstElementChild;
    expect(card).not.toBeNull();
    if (!card) throw new Error("Transaction card did not render");
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledOnce();
  });
});
