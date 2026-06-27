export const tweetQueue = {
  add: async (data: any) => {
    console.log("[MOCK QUEUE] Tweet job added:", data);
    return { id: "mock-tweet-job-id" };
  },
  getWaitingCount: async () => 0,
  getActiveCount: async () => 0,
  process: (fn: any) => {
    console.log("[MOCK QUEUE] Tweet processor registered");
  },
  on: (event: string, fn: any) => {
    // no-op
  }
} as any;
