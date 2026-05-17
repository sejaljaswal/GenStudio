import useSWR from 'swr';
import { Generation } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useGallery() {
  const { data, error, isLoading, mutate } = useSWR<Generation[]>(
    '/api/generations',
    fetcher,
    { refreshInterval: 5000 }
  );

  return {
    generations: data || [],
    isLoading,
    error,
    mutate,
    refetch: () => mutate(),
  };
}
