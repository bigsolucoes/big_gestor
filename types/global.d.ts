declare global {
  interface Window {
    supabase: any;
    blobService: {
      get: (userId: string, key: string) => Promise<any>;
      set: (userId: string, key: string, data: unknown) => Promise<void>;
      del: (userId: string, key: string) => Promise<void>;
    };
  }
}

export {};
