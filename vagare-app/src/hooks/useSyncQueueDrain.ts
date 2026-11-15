import { useEffect } from "react";
import { AppState } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { pingServer } from "@/services/api";
import { onBackOnline } from "@/services/connectivity";
import { logError } from "@/services/logger";
import {
  drainPendingMutations,
  hasPendingMutations,
} from "@/services/syncQueue";

// Sem NetInfo, a volta da rede é detectada testando o servidor enquanto houver pendências.
export const RECONNECT_CHECK_INTERVAL_MS = 30_000;

export function useSyncQueueDrain() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      return;
    }

    function safeDrain() {
      drainPendingMutations(token).catch((error) =>
        logError("useSyncQueueDrain", error),
      );
    }

    async function checkConnectionIfPending() {
      try {
        if (await hasPendingMutations()) {
          await pingServer();
        }
      } catch (error) {
        logError("useSyncQueueDrain.checkConnection", error);
      }
    }

    safeDrain();

    const unsubscribeBackOnline = onBackOnline(() => {
      safeDrain();
    });

    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          void checkConnectionIfPending();
        }
      },
    );

    const intervalId = setInterval(
      checkConnectionIfPending,
      RECONNECT_CHECK_INTERVAL_MS,
    );

    return () => {
      unsubscribeBackOnline();
      appStateSubscription.remove();
      clearInterval(intervalId);
    };
  }, [token]);
}
