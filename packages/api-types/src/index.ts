export type FanMeetApiResponse<T> = {
  data: T;
  meta?: {
    requestId?: string;
    timestamp: string;
  };
  error?: {
    code: string;
    message: string;
  };
};
