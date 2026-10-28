import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI } from '../api/bookings';
import { favoritesAPI, type FavoriteRecord } from '../api/favorites';
import {
  notificationsAPI,
  type NotificationRecord,
} from '../api/notifications';
import { reviewsAPI } from '../api/reviews';
import { searchAPI, type ListingSearchParams } from '../api/search';
import { listingsAPI } from '../api/listings';
import type { Review } from '../api/types';

export const rentraQueryKeys = {
  listingSearch: (params: ListingSearchParams) =>
    ['listings', 'search', params] as const,
  listing: (id: string) => ['listings', 'detail', id] as const,
  favoriteStatus: (id: string) => ['favorites', 'status', id] as const,
  favorites: ['favorites'] as const,
  listingReviews: (id: string) => ['reviews', 'listing', id] as const,
  bookings: ['bookings', 'mine'] as const,
  reviewsByUser: (id: string) => ['reviews', 'user', id] as const,
  notifications: ['notifications'] as const,
};

export function useListingSearch<T>(params: ListingSearchParams) {
  return useQuery({
    queryKey: rentraQueryKeys.listingSearch(params),
    queryFn: () => searchAPI.listings<T>(params),
  });
}

export function useListingDetails<T>(id: string) {
  return useQuery({
    queryKey: rentraQueryKeys.listing(id),
    queryFn: () => listingsAPI.getOne<T>(id),
    enabled: Boolean(id),
  });
}

export function useListingReviewSummary(id: string) {
  return useQuery({
    queryKey: rentraQueryKeys.listingReviews(id),
    queryFn: () => reviewsAPI.getListingSummary(id),
    enabled: Boolean(id),
  });
}

export function useFavoriteStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: rentraQueryKeys.favoriteStatus(id),
    queryFn: () => favoritesAPI.has(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useFavorites(enabled = true) {
  return useQuery({
    queryKey: rentraQueryKeys.favorites,
    queryFn: () => favoritesAPI.list<FavoriteRecord>(),
    enabled,
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation<
    { saved: false },
    Error,
    string,
    { previous: FavoriteRecord[] | undefined }
  >({
    mutationFn: (id) => favoritesAPI.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: rentraQueryKeys.favorites });
      const previous =
        queryClient.getQueryData<FavoriteRecord[]>(rentraQueryKeys.favorites);
      queryClient.setQueryData<FavoriteRecord[]>(
        rentraQueryKeys.favorites,
        (favorites) => favorites?.filter((favorite) => favorite.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(rentraQueryKeys.favorites, context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: rentraQueryKeys.favorites }),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation<
    { id: string } | { saved: false },
    Error,
    { id: string; saved: boolean },
    { queryKey: readonly unknown[]; previous: { saved: boolean } | undefined }
  >({
    mutationFn: async ({ id, saved }) => {
      if (saved) {
        await favoritesAPI.remove(id);
        return { saved: false };
      }
      return favoritesAPI.add(id);
    },
    onMutate: async ({ id, saved }) => {
      const queryKey = rentraQueryKeys.favoriteStatus(id);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ saved: boolean }>(queryKey);
      queryClient.setQueryData(queryKey, { saved: !saved });
      return { queryKey, previous };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      if (context.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      } else {
        queryClient.removeQueries({ queryKey: context.queryKey, exact: true });
      }
    },
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: rentraQueryKeys.favoriteStatus(id),
      });
      void queryClient.invalidateQueries({
        queryKey: rentraQueryKeys.favorites,
      });
    },
  });
}

export function useBookings<T>() {
  return useQuery({
    queryKey: rentraQueryKeys.bookings,
    queryFn: () => bookingsAPI.mine<T>(),
  });
}

export function useCancelBooking<T>() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bookingsAPI.cancel<T>(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: rentraQueryKeys.bookings }),
  });
}

export function useMyReviews(userId: string) {
  return useQuery({
    queryKey: rentraQueryKeys.reviewsByUser(userId),
    queryFn: async () => {
      const reviews = await reviewsAPI.getAll();
      return reviews.filter((review: Review) => review.userId === userId);
    },
    enabled: Boolean(userId),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: rentraQueryKeys.notifications,
    queryFn: () => notificationsAPI.list(),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsAPI.markRead(id),
    onSuccess: (_result, id) => {
      queryClient.setQueryData<NotificationRecord[]>(
        rentraQueryKeys.notifications,
        (items) =>
          items?.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
      );
      return queryClient.invalidateQueries({
        queryKey: rentraQueryKeys.notifications,
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationRecord[]>(
        rentraQueryKeys.notifications,
        (items) => items?.map((item) => ({ ...item, isRead: true })),
      );
      return queryClient.invalidateQueries({
        queryKey: rentraQueryKeys.notifications,
      });
    },
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsAPI.clearAll(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationRecord[]>(rentraQueryKeys.notifications, []);
      return queryClient.invalidateQueries({ queryKey: rentraQueryKeys.notifications });
    },
  });
}
