export const LOCAL_ID_PREFIX = 'local-';

export function isLocalId(id: string): boolean {
  return id.startsWith(LOCAL_ID_PREFIX);
}
