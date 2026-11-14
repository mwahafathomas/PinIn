type BackHandler = () => boolean;

interface BackHandlerEntry {
  id: number;
  handler: BackHandler;
}

const backHandlerStack: BackHandlerEntry[] = [];
let nextHandlerId = 1;

/**
 * Registers an active modal/overlay back handler at the top of the LIFO stack.
 * Returns a cleanup function that removes this handler when the modal closes/unmounts.
 */
export function registerBackHandler(handler: BackHandler): () => void {
  const id = nextHandlerId++;
  backHandlerStack.push({ id, handler });

  return () => {
    const idx = backHandlerStack.findIndex((entry) => entry.id === id);
    if (idx !== -1) {
      backHandlerStack.splice(idx, 1);
    }
  };
}

/**
 * Executes the topmost registered overlay back handler.
 * Returns true if an active overlay/modal consumed the back press.
 */
export function consumeTopBackHandler(): boolean {
  for (let i = backHandlerStack.length - 1; i >= 0; i--) {
    const entry = backHandlerStack[i];
    try {
      if (entry.handler()) {
        return true;
      }
    } catch (err) {
      console.warn('Back handler execution warning:', err);
    }
  }
  return false;
}
