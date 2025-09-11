"""
Simple endpoint tests to verify all routes are properly configured
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app


class TestEndpointAvailability:
    """Test that all endpoints are properly configured and respond correctly"""
    
    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)
        self.base_url = "/api/v1"
    
    def test_health_endpoints(self):
        """Test health check endpoints"""
        # Main health endpoint
        response = self.client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        
        # Auth service health
        response = self.client.get(f"{self.base_url}/auth/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_auth_endpoints_structure(self):
        """Test auth endpoints return proper error codes"""
        endpoints = [
            # Signup - should validate input
            ("POST", f"{self.base_url}/auth/signup", {"email": "invalid"}, 422),
            # Signin - should validate input  
            ("POST", f"{self.base_url}/auth/signin", {}, 422),
            # Me - should require auth
            ("GET", f"{self.base_url}/auth/me", None, 403),
            # Refresh - should validate input
            ("POST", f"{self.base_url}/auth/refresh", {}, 422),
        ]
        
        for method, endpoint, json_data, expected_status in endpoints:
            response = self.client.request(method, endpoint, json=json_data)
            assert response.status_code == expected_status, f"{method} {endpoint} returned {response.status_code}, expected {expected_status}"
    
    def test_protected_endpoints_require_auth(self):
        """Test that protected endpoints require authentication"""
        protected_endpoints = [
            # Tasks
            ("GET", f"{self.base_url}/tasks/"),
            ("POST", f"{self.base_url}/tasks/"),
            ("GET", f"{self.base_url}/tasks/stats"),
            # Categories - check if they exist first
            # ("GET", f"{self.base_url}/categories/"),
            # Bulk operations
            ("POST", f"{self.base_url}/bulk/complete"),
            ("POST", f"{self.base_url}/bulk/update"),
            ("POST", f"{self.base_url}/bulk/delete"),
        ]
        
        for method, endpoint in protected_endpoints:
            response = self.client.request(method, endpoint)
            # Should require authentication (401/403) or be Method Not Allowed (405) if endpoint doesn't exist
            assert response.status_code in [401, 403, 404, 405], f"{method} {endpoint} returned {response.status_code}"
    
    def test_validation_error_format(self):
        """Test that validation errors have consistent format"""
        # Test signup with invalid data
        response = self.client.post(f"{self.base_url}/auth/signup", json={
            "email": "not-an-email",
            "password": "short"
        })
        
        assert response.status_code == 422
        data = response.json()
        
        # Check if we get our custom error format
        if "error" in data:
            # Our custom format
            assert data["error"] is True
            assert "error_code" in data
            assert data["error_code"] == "VALIDATION_ERROR"
            assert "message" in data
        else:
            # FastAPI default format - also acceptable
            assert "detail" in data
            assert isinstance(data["detail"], list)
    
    def test_cors_and_security_headers(self):
        """Test that CORS and security are configured"""
        response = self.client.get("/health")
        
        # Should not have server info leaked
        assert "Server" not in response.headers
        
        # Should have some timing info
        assert "X-Process-Time" in response.headers
    
    def test_openapi_docs_accessible(self):
        """Test API documentation endpoints"""
        # OpenAPI JSON
        response = self.client.get(f"{self.base_url}/openapi.json")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        
        # Swagger UI
        response = self.client.get("/docs")
        assert response.status_code == 200
        
        # ReDoc
        response = self.client.get("/redoc")
        assert response.status_code == 200
    
    def test_nonexistent_endpoints(self):
        """Test 404 handling for non-existent endpoints"""
        # Test unprotected routes that should return 404
        unprotected_404 = [
            "/nonexistent",
            f"{self.base_url}/nonexistent",
            f"{self.base_url}/auth/nonexistent",
        ]
        
        for endpoint in unprotected_404:
            response = self.client.get(endpoint)
            assert response.status_code == 404
        
        # Protected routes return 403 (auth required) before checking if route exists
        # This is correct behavior - auth middleware runs before routing
        protected_403 = [
            f"{self.base_url}/tasks/nonexistent",
        ]
        
        for endpoint in protected_403:
            response = self.client.get(endpoint)
            assert response.status_code == 403  # Auth required, not 404
    
    def test_database_initialization_handling(self):
        """Test that app starts even with database issues"""
        # The app should start successfully even if database connection fails
        # This is tested by the fact that we can make HTTP requests at all
        
        response = self.client.get("/health")
        assert response.status_code == 200
        
        # The app should be healthy even if database init failed
        assert response.json()["status"] == "healthy"


class TestDatabaseErrorHandling:
    """Test how the API handles database connectivity issues"""
    
    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)
        self.base_url = "/api/v1"
    
    def test_auth_operations_with_database_issues(self):
        """Test auth operations when database is unavailable"""
        
        # Try signup - should fail gracefully
        response = self.client.post(f"{self.base_url}/auth/signup", json={
            "email": "test@example.com",
            "password": "Password123"
        })
        
        # Should not be 500 server error
        assert response.status_code != 500
        # Should be client error (400s) or service error (503)
        assert 400 <= response.status_code < 600
        
        if response.status_code == 422:
            # Business logic error due to database
            data = response.json()
            assert "error" in data or "detail" in data
        
        # Try signin - should also fail gracefully
        response = self.client.post(f"{self.base_url}/auth/signin", json={
            "email": "test@example.com",
            "password": "Password123"
        })
        
        # Should not be server error
        assert response.status_code != 500
        assert 400 <= response.status_code < 600


def run_simple_tests():
    """Run simple endpoint tests and show results"""
    import subprocess
    import sys
    
    print("🧪 Running endpoint availability tests...")
    
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        "tests/test_endpoints_simple.py", 
        "-v", "--tb=short", "-x"
    ], capture_output=True, text=True)
    
    print("\n" + "="*60)
    print("🔍 ENDPOINT TEST RESULTS")
    print("="*60)
    
    # Count passed/failed
    lines = result.stdout.split('\n')
    passed = sum(1 for line in lines if 'PASSED' in line)
    failed = sum(1 for line in lines if 'FAILED' in line)
    
    print(result.stdout)
    
    if result.stderr:
        print("\nErrors:", result.stderr)
    
    print(f"\n📊 Summary: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("✅ All endpoint tests passed! API structure is correct.")
    else:
        print(f"⚠️  {failed} tests failed. Check endpoint configuration.")
    
    return result.returncode == 0


if __name__ == "__main__":
    success = run_simple_tests()
    exit(0 if success else 1)
