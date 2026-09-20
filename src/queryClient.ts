import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh cache
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
      refetchOnWindowFocus: false, // Don't refetch on window focus to reduce egress
      refetchOnMount: false, // Don't refetch on every component mount/page navigation
      refetchOnReconnect: false, // Don't refetch on network reconnect
      retry: 1,
    },
  },
});
