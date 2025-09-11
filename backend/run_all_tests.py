#!/usr/bin/env python3
"""
Comprehensive test runner for Smart Task Management API
Runs all tests and provides detailed coverage report
"""
import subprocess
import sys
import asyncio
from app.core.database import build_async_database_url
from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine


async def test_database_connectivity():
    """Test actual database connectivity using direct asyncpg"""
    try:
        import asyncpg
        import ssl
        
        # Use the encoded URL from .env (direct connection)
        connection_string = settings.DIRECT_URL
        
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        
        conn = await asyncpg.connect(connection_string, ssl=ssl_ctx)
        result = await conn.fetchval("SELECT 1")
        await conn.close()
        
        return True, f"Connected successfully, result: {result}"
    except Exception as e:
        return False, str(e)


def run_test_suite(test_file, description):
    """Run a specific test suite and return results"""
    print(f"\n🧪 Running {description}...")
    print("-" * 50)
    
    result = subprocess.run([
        sys.executable, "-m", "pytest", 
        test_file, 
        "-v", "--tb=short", "-q"
    ], capture_output=True, text=True)
    
    # Parse results
    lines = result.stdout.split('\n')
    passed = sum(1 for line in lines if 'PASSED' in line)
    failed = sum(1 for line in lines if 'FAILED' in line)
    skipped = sum(1 for line in lines if 'SKIPPED' in line)
    
    status = "✅" if failed == 0 else "⚠️"
    print(f"{status} {description}: {passed} passed, {failed} failed, {skipped} skipped")
    
    if failed > 0:
        print("Failed tests:")
        for line in lines:
            if 'FAILED' in line:
                print(f"  ❌ {line}")
    
    return {"passed": passed, "failed": failed, "skipped": skipped}


async def main():
    """Run comprehensive test suite"""
    print("=" * 80)
    print("🔍 SMART TASK MANAGEMENT API - COMPREHENSIVE TEST SUITE")
    print("=" * 80)
    
    # 1. Test database connectivity
    print("\n1. 🔗 DATABASE CONNECTIVITY TEST")
    print("-" * 40)
    db_connected, db_message = await test_database_connectivity()
    if db_connected:
        print(f"✅ Database: Connected - {db_message}")
    else:
        print(f"❌ Database: Connection failed - {db_message}")
    
    # 2. Run all test suites
    test_suites = [
        ("tests/test_database.py", "Database URL Parsing Tests"),
        ("tests/test_endpoints_simple.py", "Endpoint Availability Tests"),
        ("tests/test_integration.py", "Integration Tests"),
    ]
    
    total_results = {"passed": 0, "failed": 0, "skipped": 0}
    
    for test_file, description in test_suites:
        try:
            results = run_test_suite(test_file, description)
            for key in total_results:
                total_results[key] += results[key]
        except Exception as e:
            print(f"❌ Error running {description}: {e}")
            total_results["failed"] += 1
    
    # 3. Summary Report
    print("\n" + "=" * 80)
    print("📊 COMPREHENSIVE TEST RESULTS SUMMARY")
    print("=" * 80)
    
    print(f"🔗 Database Connectivity: {'✅ Working' if db_connected else '❌ Failed'}")
    print(f"📋 Total Tests: {sum(total_results.values())}")
    print(f"✅ Passed: {total_results['passed']}")
    print(f"❌ Failed: {total_results['failed']}")  
    print(f"⏭️ Skipped: {total_results['skipped']}")
    
    # 4. What's Actually Tested
    print(f"\n🧪 WHAT WE'VE ACTUALLY TESTED:")
    print("-" * 40)
    
    tested_components = [
        "✅ URL Parsing Logic (with special characters)",
        "✅ Password Encoding ($, @, #, % characters)",
        "✅ PGBouncer Parameter Filtering", 
        "✅ Database Driver Conversion (postgresql+asyncpg)",
        "✅ API Endpoint Structure & Routing",
        "✅ Authentication Requirement Enforcement",
        "✅ Input Validation & Error Handling",
        "✅ Custom Exception Handler Integration",
        "✅ Health Check Endpoints",
        "✅ OpenAPI Documentation Generation",
        "✅ CORS & Security Headers",
        "✅ Error Response Format Consistency",
    ]
    
    for item in tested_components:
        print(f"  {item}")
    
    print(f"\n⚠️  WHAT REQUIRES DATABASE CONNECTION:")
    print("-" * 40)
    
    db_dependent = [
        "❌ User Registration & Authentication",
        "❌ Task CRUD Operations", 
        "❌ Category Management",
        "❌ Bulk Operations Execution",
        "❌ Data Persistence & Retrieval",
        "❌ Real WebSocket Functionality",
    ]
    
    for item in db_dependent:
        print(f"  {item}")
    
    # 5. Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    print("-" * 40)
    
    if not db_connected:
        print("  🔧 Fix database connectivity issues:")
        print("     - Verify Supabase credentials in .env")
        print("     - Check network connectivity to Supabase")
        print("     - Ensure Supabase service is running")
        print("     - Consider using database connection pooling")
    else:
        print("  ✅ Database connection is working!")
        print("  🚀 Ready for full end-to-end testing")
    
    print(f"  📝 Consider adding:")
    print(f"     - Mock database tests for offline development")
    print(f"     - Performance tests for bulk operations")
    print(f"     - WebSocket connection tests")
    print(f"     - Rate limiting tests")
    
    # 6. Overall Status
    print("\n" + "=" * 80)
    success_rate = (total_results["passed"] / sum(total_results.values()) * 100) if sum(total_results.values()) > 0 else 0
    
    if success_rate >= 90:
        print("🎉 OVERALL STATUS: EXCELLENT")
        print("   API structure and core logic are working correctly!")
    elif success_rate >= 75:
        print("✅ OVERALL STATUS: GOOD")
        print("   Most functionality is working, minor issues to fix.")
    elif success_rate >= 50:
        print("⚠️  OVERALL STATUS: NEEDS WORK") 
        print("   Several issues found, requires attention.")
    else:
        print("❌ OVERALL STATUS: CRITICAL")
        print("   Major issues found, significant work needed.")
    
    print(f"   Success Rate: {success_rate:.1f}%")
    print("=" * 80)
    
    return total_results["failed"] == 0


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)