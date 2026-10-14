/**
 * Composable to access the global configured $api fetch client
 *
 * Usage:
 *   const api = useApi()
 *   const res = await api.get<RestaurantListResponse>('/api/v1/owner/restaurants')
 *   const created = await api.post('/api/v1/owner/restaurants', newRestaurant)
 */
export const useApi = () => {
  const { $api } = useNuxtApp()
  return $api
}
