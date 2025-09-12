import { useQuery } from '@tanstack/react-query'
import { UsersService, type UserListResponse, type PublicUser } from '../services/usersService'

export const USER_KEYS = {
	all: ['users'] as const,
	list: () => [...USER_KEYS.all, 'list'] as const,
	detail: (id: string) => [...USER_KEYS.all, 'detail', id] as const,
}

export function useUsers() {
	return useQuery({
		queryKey: USER_KEYS.list(),
		queryFn: (): Promise<UserListResponse> => UsersService.list(),
		staleTime: 60 * 1000,
	})
}

export function useUser(userId: string) {
	return useQuery({
		queryKey: USER_KEYS.detail(userId),
		queryFn: (): Promise<PublicUser> => UsersService.get(userId),
		enabled: !!userId,
		staleTime: 60 * 1000,
	})
}
