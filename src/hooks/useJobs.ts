import { useQuery } from "@tanstack/react-query";

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs"); 
      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }
      return res.json();
    },
  });
}