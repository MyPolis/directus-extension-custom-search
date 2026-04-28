declare module 'directus:api' {
  export interface SandboxHookRegisterContext {
    filter: (
      event: string,
      handler: (...args: any[]) => any,
    ) => void
    action: (
      event: string,
      handler: (...args: any[]) => any,
    ) => void
  }
}