"""
Test that API endpoints are properly configured and accessible.
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app
import json

def test_api_endpoints():
    """Test that API endpoints are properly configured"""
    
    with TestClient(app) as client:
        
        # Test health endpoint
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ Health endpoint working")
        
        # Test API docs are accessible
        response = client.get("/docs")
        assert response.status_code == 200
        print("✅ API docs accessible")
        
        # Test OpenAPI spec
        response = client.get("/api/v1/openapi.json")
        assert response.status_code == 200
        spec = response.json()
        
        # Verify all our endpoints are included
        paths = spec.get("paths", {})
        
        # Check auth endpoints
        auth_endpoints = [
            "/api/v1/auth/signup",
            "/api/v1/auth/signin", 
            "/api/v1/auth/refresh",
            "/api/v1/auth/signout",
            "/api/v1/auth/me",
            "/api/v1/auth/health"
        ]
        
        for endpoint in auth_endpoints:
            assert endpoint in paths, f"Missing auth endpoint: {endpoint}"
        print("✅ All auth endpoints configured")
        
        # Check task endpoints
        task_endpoints = [
            "/api/v1/tasks/",
            "/api/v1/tasks/stats", 
            "/api/v1/tasks/{task_id}",
            "/api/v1/tasks/{task_id}/complete",
            "/api/v1/tasks/{task_id}/uncomplete"
        ]
        
        for endpoint in task_endpoints:
            assert endpoint in paths, f"Missing task endpoint: {endpoint}"
        print("✅ All task endpoints configured")
        
        # Check bulk operation endpoints  
        bulk_endpoints = [
            "/api/v1/bulk/complete",
            "/api/v1/bulk/update",
            "/api/v1/bulk/delete",
            "/api/v1/bulk/status",
            "/api/v1/bulk/priority",
            "/api/v1/bulk/category"
        ]
        
        for endpoint in bulk_endpoints:
            assert endpoint in paths, f"Missing bulk endpoint: {endpoint}"
        print("✅ All bulk operation endpoints configured")
        
        # Check category endpoints
        category_endpoints = [
            "/api/v1/categories/",
            "/api/v1/categories/project/{project_id}",
            "/api/v1/categories/stats",
            "/api/v1/categories/{category_id}",
            "/api/v1/categories/{category_id}/reorder"
        ]
        
        for endpoint in category_endpoints:
            assert endpoint in paths, f"Missing category endpoint: {endpoint}"
        print("✅ All category endpoints configured")
        
        # Check that endpoints have proper HTTP methods
        assert "post" in paths["/api/v1/auth/signup"], "Signup should support POST"
        assert "get" in paths["/api/v1/tasks/"], "Tasks should support GET"
        assert "post" in paths["/api/v1/tasks/"], "Tasks should support POST"
        assert "put" in paths["/api/v1/tasks/{task_id}"], "Task update should support PUT"
        assert "delete" in paths["/api/v1/tasks/{task_id}"], "Task delete should support DELETE"
        
        print("✅ HTTP methods properly configured")
        
        # Test that protected endpoints require authentication (401 without token)
        protected_endpoints = [
            ("/api/v1/auth/me", "get"),
            ("/api/v1/tasks/", "get"),
            ("/api/v1/categories/stats", "get")
        ]
        
        for endpoint, method in protected_endpoints:
            if method == "get":
                response = client.get(endpoint)
            elif method == "post":
                response = client.post(endpoint, json={})
                
            # Should get 401, 403, or 422 (missing/invalid auth)
            assert response.status_code in [401, 403, 422], f"Protected endpoint {endpoint} should require auth, got {response.status_code}"
        
        print("✅ Protected endpoints require authentication")
        
        # Check that tags are used in operations (not necessarily in the tags array)
        auth_ops = [op for path_data in paths.values() for op in path_data.values() 
                   if isinstance(op, dict) and "Authentication" in op.get("tags", [])]
        assert len(auth_ops) > 0, "No Authentication operations found"
        
        task_ops = [op for path_data in paths.values() for op in path_data.values() 
                   if isinstance(op, dict) and "Tasks" in op.get("tags", [])]
        assert len(task_ops) > 0, "No Task operations found"
        
        bulk_ops = [op for path_data in paths.values() for op in path_data.values() 
                   if isinstance(op, dict) and "Bulk Operations" in op.get("tags", [])]
        assert len(bulk_ops) > 0, "No Bulk Operations operations found"
        
        category_ops = [op for path_data in paths.values() for op in path_data.values() 
                       if isinstance(op, dict) and "Categories" in op.get("tags", [])]
        assert len(category_ops) > 0, "No Category operations found"
        
        print("✅ OpenAPI operation tags properly configured")
        
        print("🎉 All API endpoint tests passed! All endpoints properly configured!")

if __name__ == "__main__":
    test_api_endpoints()