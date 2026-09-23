import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export interface NetInfoState {
  type: string;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  details: Record<string, unknown> | null;
}

type NetInfoListener = (state: NetInfoState) => void;

const listeners = new Set<NetInfoListener>();

let currentState: NetInfoState = {
  type: 'unknown',
  isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isInternetReachable: typeof navigator !== 'undefined' ? navigator.onLine : true,
  details: null,
};

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(currentState);
    } catch (e) {
      console.warn('Error in NetInfo listener:', e);
    }
  });
}

function updateConnection(isConnected: boolean, connectionType = 'unknown') {
  const changed =
    currentState.isConnected !== isConnected ||
    currentState.isInternetReachable !== isConnected;

  currentState = {
    type: connectionType,
    isConnected,
    isInternetReachable: isConnected,
    details: null,
  };

  if (changed) {
    notifyListeners();
  }
}

// 1. Initial browser setup & listeners
if (typeof window !== 'undefined') {
  updateConnection(navigator.onLine);

  window.addEventListener('online', () => {
    updateConnection(true);
  });

  window.addEventListener('offline', () => {
    updateConnection(false);
  });
}

// 2. Capacitor Network integration for Android / native APK hardware accuracy
try {
  Network.getStatus()
    .then((status) => {
      if (status && typeof status.connected === 'boolean') {
        updateConnection(status.connected, status.connectionType || 'cellular');
      }
    })
    .catch(() => {});

  Network.addListener('networkStatusChange', (status) => {
    if (status && typeof status.connected === 'boolean') {
      updateConnection(status.connected, status.connectionType || 'cellular');
    }
  }).catch(() => {});
} catch {
  // Capacitor Network unavailable in pure web preview
}

/**
 * NetInfo module implementing @react-native-community/netinfo API
 */
export function addEventListener(listener: NetInfoListener): () => void {
  listeners.add(listener);
  // Call listener immediately with current state
  try {
    listener(currentState);
  } catch {}

  return () => {
    listeners.delete(listener);
  };
}

export async function fetch(): Promise<NetInfoState> {
  try {
    const status = await Network.getStatus();
    if (status && typeof status.connected === 'boolean') {
      updateConnection(status.connected, status.connectionType);
    }
  } catch {
    if (typeof navigator !== 'undefined') {
      updateConnection(navigator.onLine);
    }
  }
  return currentState;
}

export function useNetInfo(): NetInfoState {
  const [state, setState] = useState<NetInfoState>(currentState);

  useEffect(() => {
    const unsubscribe = addEventListener(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}

const NetInfo = {
  addEventListener,
  fetch,
  useNetInfo,
};

export default NetInfo;
