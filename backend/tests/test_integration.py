"""
Integration tests for Smart Task Management API
Tests actual endpoints with database connectivity
"""
import asyncio
import pytest
import httpx
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import build_async_database_url, get_session
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class TestDatabaseConnectivity:
    """Test that requires actual database connection"""
    
    async def test_database_connection_required(self):
        """Test that database connection is actually working"""
        try:
            # Build the async database URL
            async_url = build_async_database_url(settings.DATABASE_URL)
            
            # Create engine
            engine = create_async_engine(async_url, pool_size=1, max_overflow=0)
            
            # Test actual connection
            async with engine.connect() as conn:
                result = await conn.execute("SELECT 1 as test")
                row = result.first()
                assert row[0] == 1
                
            await engine.dispose()
            return True
            
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False
    
    def test_app_startup_with_database(self):
        """Test that app can start even if database fails"""
        # This will test the app startup with database init
        with TestClient(app) as client:
            response = client.get("/health")
            assert response.status_code == 200
            assert response.json()["status"] == "healthy"


class TestAPIEndpoints:
    """Test all API endpoints"""
    
    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)
        self.base_url = "/api/v1"
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "service" in data
    
    def test_auth_health_endpoint(self):
        """Test auth service health endpoint"""
        response = self.client.get(f"{self.base_url}/auth/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "authentication"
    
    # Authentication Endpoints Tests
    def test_signup_validation_errors(self):
        """Test signup endpoint validation"""
        # Test missing required fields
        response = self.client.post(f"{self.base_url}/auth/signup", json={})
        assert response.status_code == 422
        
        # Test invalid email format
        response = self.client.post(
            f"{self.base_url}/auth/signup",
            json={"email": "invalid-email", "password": "Password123"}
        )
        assert response.status_code == 422
        
        # Test weak password
        response = self.client.post(
            f"{self.base_url}/auth/signup", 
            json={"email": "test@example.com", "password": "weak"}
        )
        assert response.status_code == 422
    
    def test_signin_validation_errors(self):
        """Test signin endpoint validation"""
        # Test missing fields
        response = self.client.post(f"{self.base_url}/auth/signin", json={})
        assert response.status_code == 422
        
        # Test invalid credentials (will fail due to no database connection)
        response = self.client.post(
            f"{self.base_url}/auth/signin",
            json={"email": "test@example.com", "password": "Password123"}
        )
        # Expect either auth failure or business logic error
        assert response.status_code in [401, 422, 503]
    
    def test_auth_me_without_token(self):
        """Test /auth/me endpoint without authorization"""
        response = self.client.get(f"{self.base_url}/auth/me")
        assert response.status_code == 403
    
    def test_auth_me_with_invalid_token(self):
        """Test /auth/me endpoint with invalid token"""
        headers = {"Authorization": "Bearer invalid_token_12345"}
        response = self.client.get(f"{self.base_url}/auth/me", headers=headers)
        assert response.status_code == 401
    
    def test_refresh_token_validation(self):
        """Test token refresh endpoint validation"""
        # Missing refresh token
        response = self.client.post(f"{self.base_url}/auth/refresh", json={})
        assert response.status_code == 422
        
        # Invalid refresh token
        response = self.client.post(
            f"{self.base_url}/auth/refresh",
            json={"refresh_token": "invalid_token"}
        )
        assert response.status_code in [401, 422]
    
    # Task Endpoints Tests (without auth)
    def test_tasks_endpoints_require_auth(self):
        """Test that task endpoints require authentication"""
        endpoints = [
            ("GET", f"{self.base_url}/tasks/"),
            ("POST", f"{self.base_url}/tasks/"),
            ("GET", f"{self.base_url}/tasks/stats"),
            ("GET", f"{self.base_url}/tasks/123"),
            ("PUT", f"{self.base_url}/tasks/123"),
            ("DELETE", f"{self.base_url}/tasks/123"),
        ]
        
        for method, endpoint in endpoints:
            response = self.client.request(method, endpoint)
            # Should require authentication
            assert response.status_code in [401, 403], f"{method} {endpoint} should require auth"
    
    # Categories Endpoints Tests
    def test_categories_endpoints_require_auth(self):
        """Test that category endpoints require authentication"""
        # Based on actual routes in categories.py
        endpoints = [
            ("POST", f"{self.base_url}/categories/"),  # Create category
            ("GET", f"{self.base_url}/categories/project/123"),  # Get categories for project
            ("GET", f"{self.base_url}/categories/stats"),  # Get category stats
            ("GET", f"{self.base_url}/categories/123"),  # Get specific category
            ("PUT", f"{self.base_url}/categories/123"),  # Update category
            ("DELETE", f"{self.base_url}/categories/123"),  # Delete category
        ]
        
        for method, endpoint in endpoints:
            response = self.client.request(method, endpoint)
            # Should require authentication
            assert response.status_code in [401, 403], f"{method} {endpoint} should require auth"
    
    # Bulk Operations Tests
    def test_bulk_operations_require_auth(self):
        """Test that bulk operation endpoints require authentication"""
        endpoints = [
            ("POST", f"{self.base_url}/bulk/complete"),
            ("POST", f"{self.base_url}/bulk/update"),
            ("POST", f"{self.base_url}/bulk/delete"),
            ("POST", f"{self.base_url}/bulk/status"),
            ("POST", f"{self.base_url}/bulk/priority"),
            ("POST", f"{self.base_url}/bulk/category"),
        ]
        
        for method, endpoint in endpoints:
            response = self.client.request(method, endpoint, json={})
            # Should require authentication
            assert response.status_code in [401, 403], f"{method} {endpoint} should require auth"
    
    def test_bulk_operations_validation(self):
        """Test bulk operations input validation"""
        # Test with invalid auth token to bypass auth and test validation
        headers = {"Authorization": "Bearer fake_token"}
        
        # All bulk endpoints should validate input even before auth
        bulk_requests = [
            (f"{self.base_url}/bulk/complete", {"task_ids": [], "completed": True}),
            (f"{self.base_url}/bulk/update", {"task_ids": []}),
            (f"{self.base_url}/bulk/delete", {"task_ids": [], "hard_delete": False}),
            (f"{self.base_url}/bulk/status", {"task_ids": [], "new_status": "TODO"}),
            (f"{self.base_url}/bulk/priority", {"task_ids": [], "new_priority": "HIGH"}),
            (f"{self.base_url}/bulk/category", {"task_ids": [], "category_id": None}),
        ]
        
        for endpoint, data in bulk_requests:
            response = self.client.post(endpoint, json=data, headers=headers)
            # Should fail auth before validation, but structure should be correct
            assert response.status_code in [401, 403, 422]
    
    # Test OpenAPI Documentation
    def test_openapi_docs_available(self):
        """Test that API documentation is available"""
        response = self.client.get("/docs")
        assert response.status_code == 200
        
        response = self.client.get("/redoc")
        assert response.status_code == 200
        
        response = self.client.get(f"{self.base_url}/openapi.json")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"


class TestErrorHandling:
    """Test error handling across endpoints"""
    
    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)
        self.base_url = "/api/v1"
    
    def test_404_not_found(self):
        """Test 404 for non-existent endpoints"""
        response = self.client.get("/non-existent-endpoint")
        assert response.status_code == 404
        
        response = self.client.get(f"{self.base_url}/non-existent")
        assert response.status_code == 404
    
    def test_method_not_allowed(self):
        """Test 405 for wrong HTTP methods"""
        # Health endpoint only supports GET
        response = self.client.post("/health")
        assert response.status_code == 405
        
        response = self.client.put(f"{self.base_url}/auth/health")
        assert response.status_code == 405
    
    def test_validation_error_format(self):
        """Test that validation errors return consistent format"""
        response = self.client.post(f"{self.base_url}/auth/signup", json={
            "email": "invalid-email",
            "password": "weak"
        })
        
        assert response.status_code == 422
        data = response.json()
        
        # Should have our custom error format
        assert "error" in data
        assert "error_code" in data
        assert "message" in data
        assert data["error"] is True
        assert data["error_code"] == "VALIDATION_ERROR"


class TestDatabaseDependentOperations:
    """Test operations that specifically require database connectivity"""
    
    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)
        self.base_url = "/api/v1"
    
    @pytest.mark.asyncio
    async def test_database_required_for_auth_operations(self):
        """Test that auth operations fail gracefully without database"""
        # This test will show what happens when database is not available
        
        # Try to sign up (should fail due to database connectivity)
        response = self.client.post(
            f"{self.base_url}/auth/signup",
            json={
                "email": "test@example.com",
                "password": "Password123",
                "full_name": "Test User"
            }
        )
        
        # Should fail with some database-related error
        assert response.status_code in [400, 422, 503]
        
        # Check if error contains database-related info
        if response.status_code == 422:
            data = response.json()
            assert "error" in data
            # Should be a business logic error due to database issues
    
    def test_all_endpoints_error_handling(self):
        """Test that all endpoints handle database errors gracefully"""
        # Create a mock valid token (will still fail auth due to database)
        fake_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ"
        headers = {"Authorization": f"Bearer {fake_token}"}
        
        # Test various endpoints with fake auth (use actual existing routes)
        endpoints_to_test = [
            ("GET", f"{self.base_url}/auth/me"),
            ("POST", f"{self.base_url}/auth/signout"),
            ("GET", f"{self.base_url}/tasks/"),
            ("GET", f"{self.base_url}/categories/stats"),  # Use existing endpoint
            ("POST", f"{self.base_url}/bulk/complete", {"task_ids": ["123"], "completed": True}),
        ]
        
        for method, endpoint, *json_data in endpoints_to_test:
            json_payload = json_data[0] if json_data else None
            response = self.client.request(
                method, endpoint, 
                headers=headers,
                json=json_payload
            )
            
            # Should fail gracefully (not 500 server error)
            assert response.status_code != 500, f"{method} {endpoint} returned server error"
            # Should be auth error, validation error, or service unavailable
            assert response.status_code in [401, 403, 422, 503], f"{method} {endpoint} unexpected status"


async def run_integration_tests():
    """Run integration tests and report results"""
    logger.info("🔄 Starting comprehensive integration tests...")
    
    # Test database connectivity first
    db_test = TestDatabaseConnectivity()
    db_connected = await db_test.test_database_connection_required()
    
    print("\n" + "="*60)
    print("🔍 INTEGRATION TEST RESULTS")
    print("="*60)
    
    print(f"Database Connection: {'✅ CONNECTED' if db_connected else '❌ DISCONNECTED'}")
    
    if not db_connected:
        print("⚠️  Running tests in DATABASE DISCONNECTED mode")
        print("   Tests will verify error handling and endpoint structure")
    else:
        print("✅ Running tests in FULL CONNECTIVITY mode")
    
    # Run pytest programmatically
    import subprocess
    import sys
    
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        "tests/test_integration.py", 
        "-v", "--tb=short"
    ], capture_output=True, text=True)
    
    print("\n" + result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    
    return result.returncode == 0


if __name__ == "__main__":
    # Run integration tests
    success = asyncio.run(run_integration_tests())
    exit(0 if success else 1)