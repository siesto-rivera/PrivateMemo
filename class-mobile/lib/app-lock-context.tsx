import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'app_lock_enabled';
// Don't re-prompt if user backgrounded for less than this many ms (e.g. quick switch).
const GRACE_MS = 5000;

type Value = {
  enabled: boolean;
  locked: boolean;
  ready: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  setEnabled: (e: boolean) => Promise<boolean>;
  unlock: () => Promise<boolean>;
};

const Ctx = createContext<Value>({
  enabled: false,
  locked: false,
  ready: false,
  hasHardware: false,
  isEnrolled: false,
  setEnabled: async () => false,
  unlock: async () => false,
});

async function authenticate(reason: string): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: '취소',
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return false;
  }
}

export function AppLockProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasHardware, setHasHardware] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const lastBackgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const [stored, hw, enrolled] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEY),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      setHasHardware(hw);
      setIsEnrolled(enrolled);
      const isEnabled = stored === '1';
      setEnabledState(isEnabled);
      setLocked(isEnabled); // start locked if enabled
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        lastBackgroundedAt.current = Date.now();
      } else if (state === 'active') {
        const since = lastBackgroundedAt.current;
        lastBackgroundedAt.current = null;
        if (since && Date.now() - since > GRACE_MS) {
          setLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, [enabled]);

  const setEnabled = useCallback(async (next: boolean): Promise<boolean> => {
    if (next) {
      if (!hasHardware) return false;
      if (!isEnrolled) return false;
      const ok = await authenticate('앱 잠금을 활성화하려면 인증해주세요');
      if (!ok) return false;
    } else {
      const ok = await authenticate('앱 잠금을 해제하려면 인증해주세요');
      if (!ok) return false;
    }
    await SecureStore.setItemAsync(STORAGE_KEY, next ? '1' : '0');
    setEnabledState(next);
    if (!next) setLocked(false);
    return true;
  }, [hasHardware, isEnrolled]);

  const unlock = useCallback(async (): Promise<boolean> => {
    const ok = await authenticate('앱 잠금 해제');
    if (ok) setLocked(false);
    return ok;
  }, []);

  return (
    <Ctx.Provider
      value={{ enabled, locked, ready, hasHardware, isEnrolled, setEnabled, unlock }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAppLock() {
  return useContext(Ctx);
}
