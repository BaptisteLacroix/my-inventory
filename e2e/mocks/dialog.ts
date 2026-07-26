import { env } from './e2e-env';

export async function open(): Promise<string | string[] | null> {
  return env().dialogOpenResult;
}

export async function save(): Promise<string | null> {
  return env().dialogSaveResult;
}

export async function confirm(): Promise<boolean> {
  return env().dialogConfirmResult;
}
