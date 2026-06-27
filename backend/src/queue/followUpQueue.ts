export const followUpQueue = {
  add: async (data: any) => {
    console.log("[MOCK QUEUE] Follow-up job added:", data);
    return { id: "mock-followup-job-id" };
  },
  getWaitingCount: async () => 0,
  getActiveCount: async () => 0,
  process: (fn: any) => {
    console.log("[MOCK QUEUE] Follow-up processor registered");
  },
  on: (event: string, fn: any) => {
    // no-op
  }
} as any;
