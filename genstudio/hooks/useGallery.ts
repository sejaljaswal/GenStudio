import useSWR from 'swr';
import { Generation } from '@/types';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || (data && typeof data === 'object' && 'error' in data)) {
    throw new Error(data?.error || 'Failed to fetch gallery');
  }
  return data;
};

export function useGallery() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/generations',
    fetcher,
    { 
      refreshInterval: 5000,
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
    }
  );

  const isValidArray = Array.isArray(data);

  return {
    generations: isValidArray ? (data as Generation[]) : [],
    isLoading: isLoading && !data && !error,
    error: error ? error.message : !isValidArray && data ? "Invalid data received" : null,
    mutate,
    refetch: () => mutate(),
  };
}
