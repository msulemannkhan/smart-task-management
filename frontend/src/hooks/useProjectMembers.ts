import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ProjectMemberService, type ProjectMember, type ProjectMemberListResponse } from '../services/projectMemberService'

export const MEMBER_KEYS = {
  all: ['project-members'] as const,
  list: (projectId: string) => [...MEMBER_KEYS.all, projectId, 'list'] as const,
}

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: MEMBER_KEYS.list(projectId),
    queryFn: (): Promise<ProjectMemberListResponse> => ProjectMemberService.list(projectId),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}

export function useAddProjectMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ project_id, user_id, role }: { project_id: string; user_id: string; role: string }) => 
      ProjectMemberService.add(project_id, user_id, role),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: MEMBER_KEYS.list(variables.project_id) })
    },
  })
}

export function useUpdateProjectMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ project_id, member_id, role }: { project_id: string; member_id: string; role: string }) => 
      ProjectMemberService.update(project_id, member_id, role),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: MEMBER_KEYS.list(variables.project_id) })
    },
  })
}

export function useRemoveProjectMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ project_id, member_id }: { project_id: string; member_id: string }) => 
      ProjectMemberService.remove(project_id, member_id),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: MEMBER_KEYS.list(variables.project_id) })
    },
  })
}


