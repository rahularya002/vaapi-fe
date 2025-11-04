declare module 'next-auth/react' {
  export function signIn(provider?: string, options?: any): Promise<any>;
  export function signOut(options?: any): Promise<any>;
  export const useSession: any;
  export const SessionProvider: React.ComponentType<any>;
}


