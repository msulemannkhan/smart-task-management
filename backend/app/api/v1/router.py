"""
Main API router that includes all endpoints.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, tasks, bulk_operations, categories, websocket, projects, users, project_members, activities

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(bulk_operations.router, prefix="/bulk", tags=["Bulk Operations"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(websocket.router, tags=["WebSocket"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(project_members.router, prefix="/projects", tags=["Project Members"])
api_router.include_router(activities.router, prefix="/activities", tags=["Activities"])