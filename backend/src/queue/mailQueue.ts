export const mailQueue = {
  add: async (data: any) => {
    console.log("[MOCK QUEUE] Mail job added:", data);
    return { id: "mock-mail-job-id" };
  },
  getWaitingCount: async () => 0,
  getActiveCount: async () => 0,
  process: (fn: any) => {
    console.log("[MOCK QUEUE] Mail processor registered");
  },
  on: (event: string, fn: any) => {
    // no-op
  }
} as any;
