/**
 * Shared in-memory fake filesystem + dialog-result queue backing the e2e/mocks/* shims.
 * Playwright tests drive this through `window.__e2e__` (see e2e/fixtures.ts) so a single
 * source of truth is visible from both the test process and the app under test.
 */
export interface E2EFile {
  bytes?: Uint8Array;
  text?: string;
  isDir?: boolean;
}

export interface E2EEnv {
  files: Map<string, E2EFile>;
  dialogOpenResult: string | string[] | null;
  dialogSaveResult: string | null;
  dialogConfirmResult: boolean;
}

declare global {
  interface Window {
    __e2e__?: E2EEnv;
  }
}

export function env(): E2EEnv {
  if (!window.__e2e__) {
    window.__e2e__ = {
      files: new Map(),
      dialogOpenResult: null,
      dialogSaveResult: null,
      dialogConfirmResult: true,
    };
  }
  return window.__e2e__;
}
