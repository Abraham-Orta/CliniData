import { useState, useCallback } from 'react';
import { ApiError } from '../lib/apiClient';
import { toast } from 'sonner';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error | ApiError) => void;
  showToastOnError?: boolean;
}

export function useApi<T, Args extends any[]>(
  apiFunction: (...args: Args) => Promise<T>,
  options?: UseApiOptions<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | ApiError | null>(null);

  const execute = useCallback(
    async (...args: Args) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err: any) {
        setError(err);
        if (options?.onError) {
          options.onError(err);
        } else if (options?.showToastOnError !== false) {
           toast.error(err.message || 'Ha ocurrido un error inesperado');
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, options]
  );

  return { data, isLoading, error, execute, setData, setError };
}
