"use client";

import { useCallback, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@finance/ui";
import { Building2, Loader2 } from "lucide-react";

export interface ConnectBankProps {
  linkToken: string | null;
  onSuccess: (publicToken: string, metadata: PlaidLinkMetadata) => void;
  onExit?: () => void;
  isExchanging?: boolean;
}

export interface PlaidLinkMetadata {
  institution?: {
    institution_id: string;
    name: string;
  } | null;
}

export function ConnectBank({
  linkToken,
  onSuccess,
  onExit,
  isExchanging,
}: ConnectBankProps) {
  const [hasOpened, setHasOpened] = useState(false);

  const handleSuccess = useCallback(
    (publicToken: string, metadata: PlaidLinkMetadata) => {
      onSuccess(publicToken, metadata);
    },
    [onSuccess]
  );

  const handleExit = useCallback(() => {
    setHasOpened(false);
    onExit?.();
  }, [onExit]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: handleExit,
  });

  const handleClick = useCallback(() => {
    setHasOpened(true);
    open();
  }, [open]);

  const isLoading = !linkToken || !ready || isExchanging;

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      size="lg"
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Building2 className="h-4 w-4" />
      )}
      {isExchanging
        ? "Connecting..."
        : hasOpened
          ? "Reconnect Bank"
          : "Connect Your Bank"}
    </Button>
  );
}
