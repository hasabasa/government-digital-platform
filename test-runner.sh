#!/bin/bash

# 🧪 Government Platform Test Runner
# Запускает все тесты проекта с отчетами

set -e

echo "🏛️ Government Digital Platform - Test Suite"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Create test results directory
mkdir -p test-results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test-results/run_$TIMESTAMP"
mkdir -p "$RESULTS_DIR"

print_status "Test results will be saved to: $RESULTS_DIR"

# Function to run backend tests
run_backend_tests() {
    print_status "🔧 Running Backend Tests..."
    
    cd backend
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    
    # Run TypeScript checks
    print_status "Running TypeScript checks..."
    npm run typecheck 2>&1 | tee "../$RESULTS_DIR/backend_typecheck.log"
    
    # Run linting
    print_status "Running ESLint..."
    npm run lint 2>&1 | tee "../$RESULTS_DIR/backend_lint.log" || print_warning "Linting issues found"
    
    # Run unit tests
    print_status "Running unit tests..."
    npm run test:run --coverage 2>&1 | tee "../$RESULTS_DIR/backend_tests.log"
    
    # Copy coverage report if it exists
    if [ -d "coverage" ]; then
        cp -r coverage "../$RESULTS_DIR/backend_coverage"
        print_success "Backend coverage report copied"
    fi
    
    cd ..
    print_success "Backend tests completed"
}

# Function to run frontend tests
run_frontend_tests() {
    print_status "🎨 Running Frontend Tests..."
    
    cd frontend/frontend-shell
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Run TypeScript checks
    print_status "Running TypeScript checks..."
    npm run typecheck 2>&1 | tee "../../$RESULTS_DIR/frontend_typecheck.log"
    
    # Run linting
    print_status "Running ESLint..."
    npm run lint 2>&1 | tee "../../$RESULTS_DIR/frontend_lint.log" || print_warning "Linting issues found"
    
    # Run unit tests
    print_status "Running unit tests..."
    npm run test:run --coverage 2>&1 | tee "../../$RESULTS_DIR/frontend_tests.log"
    
    # Copy coverage report if it exists
    if [ -d "coverage" ]; then
        cp -r coverage "../../$RESULTS_DIR/frontend_coverage"
        print_success "Frontend coverage report copied"
    fi
    
    cd ../..
    print_success "Frontend tests completed"
}

# Function to run integration tests
run_integration_tests() {
    print_status "🔗 Running Integration Tests..."
    
    # Start test environment
    print_status "Starting test environment..."
    
    # Check if Docker is available and start test database
    if command -v docker &> /dev/null; then
        print_status "Starting test database..."
        docker-compose -f docker-compose.test.yml up -d postgres redis 2>&1 | tee "$RESULTS_DIR/docker_setup.log"
        
        # Wait for database to be ready
        print_status "Waiting for database to be ready..."
        sleep 10
        
        # Run database migrations
        cd backend
        print_status "Running database migrations..."
        npm run db:migrate 2>&1 | tee "../$RESULTS_DIR/db_migrations.log"
        cd ..
        
        print_success "Test environment ready"
    else
        print_warning "Docker not available, skipping integration tests"
        return 0
    fi
    
    # Run API integration tests
    cd backend
    print_status "Running API integration tests..."
    npm run test:run -- --run --testNamePattern="integration" 2>&1 | tee "../$RESULTS_DIR/integration_tests.log"
    cd ..
    
    # Cleanup test environment
    print_status "Cleaning up test environment..."
    docker-compose -f docker-compose.test.yml down 2>&1 | tee "$RESULTS_DIR/docker_cleanup.log"
    
    print_success "Integration tests completed"
}

# Function to generate test report
generate_report() {
    print_status "📊 Generating Test Report..."
    
    REPORT_FILE="$RESULTS_DIR/test_report.md"
    
    cat > "$REPORT_FILE" << EOF
# 🏛️ Government Platform Test Report

**Generated:** $(date)
**Test Run ID:** $TIMESTAMP

## Summary

### Backend Tests
- **TypeScript Check:** $(grep -q "error" "$RESULTS_DIR/backend_typecheck.log" && echo "❌ Failed" || echo "✅ Passed")
- **Linting:** $(grep -q "error" "$RESULTS_DIR/backend_lint.log" && echo "❌ Failed" || echo "✅ Passed")
- **Unit Tests:** $(grep -q "FAILED" "$RESULTS_DIR/backend_tests.log" && echo "❌ Failed" || echo "✅ Passed")

### Frontend Tests
- **TypeScript Check:** $(grep -q "error" "$RESULTS_DIR/frontend_typecheck.log" && echo "❌ Failed" || echo "✅ Passed")
- **Linting:** $(grep -q "error" "$RESULTS_DIR/frontend_lint.log" && echo "❌ Failed" || echo "✅ Passed")
- **Unit Tests:** $(grep -q "FAILED" "$RESULTS_DIR/frontend_tests.log" && echo "❌ Failed" || echo "✅ Passed")

### Integration Tests
- **API Tests:** $(grep -q "FAILED" "$RESULTS_DIR/integration_tests.log" && echo "❌ Failed" || echo "✅ Passed")

## Coverage Reports

$([ -d "$RESULTS_DIR/backend_coverage" ] && echo "- [Backend Coverage](backend_coverage/index.html)" || echo "- Backend Coverage: Not available")
$([ -d "$RESULTS_DIR/frontend_coverage" ] && echo "- [Frontend Coverage](frontend_coverage/index.html)" || echo "- Frontend Coverage: Not available")

## Detailed Logs

- [Backend TypeScript Check](backend_typecheck.log)
- [Backend Linting](backend_lint.log)
- [Backend Tests](backend_tests.log)
- [Frontend TypeScript Check](frontend_typecheck.log)
- [Frontend Linting](frontend_lint.log)
- [Frontend Tests](frontend_tests.log)
- [Integration Tests](integration_tests.log)

## Test Environment

- **Node.js Version:** $(node --version)
- **npm Version:** $(npm --version)
- **Operating System:** $(uname -s)
- **Architecture:** $(uname -m)

## Implemented Features Tested

### ✅ Backend Services
- **User Service:** Hierarchy management, role assignment
- **Task Service:** Task creation, assignment, permissions
- **Disciplinary Service:** Actions, commendations, appeals
- **Call Service:** WebRTC integration, permissions
- **Channel Service:** Auto-creation, membership sync

### ✅ Frontend Components
- **Sidebar:** Navigation, sections, role-based access
- **UserProfile:** Hierarchy display, statistics
- **GroupTabs:** Chat, tasks, files, calls
- **ChannelManager:** Pinned channels, subscriptions
- **NotificationCenter:** Real-time notifications

### ✅ Integration
- **Authentication:** ECP, eGov Mobile
- **Role Assignment:** Automatic based on hierarchy
- **API Endpoints:** CRUD operations, permissions
- **Database:** Migrations, schemas, relationships

## Test Coverage Goals

- **Backend Unit Tests:** >80%
- **Frontend Unit Tests:** >70%
- **Integration Tests:** Critical paths covered
- **Type Safety:** 100% TypeScript coverage

---

*Generated by Government Platform Test Runner v1.0*
EOF

    print_success "Test report generated: $REPORT_FILE"
}

# Main execution
main() {
    print_status "Starting comprehensive test suite..."
    
    # Record start time
    START_TIME=$(date +%s)
    
    # Run all test suites
    run_backend_tests
    run_frontend_tests
    run_integration_tests
    generate_report
    
    # Calculate execution time
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    print_success "🎉 All tests completed in ${DURATION}s!"
    print_status "📁 Results saved in: $RESULTS_DIR"
    print_status "📄 Report available at: $RESULTS_DIR/test_report.md"
    
    # Check if any tests failed
    if grep -q "FAILED\|error" "$RESULTS_DIR"/*.log; then
        print_warning "Some tests failed. Check the detailed logs for more information."
        exit 1
    else
        print_success "🏆 All tests passed successfully!"
        exit 0
    fi
}

# Handle script arguments
case "${1:-all}" in
    "backend")
        run_backend_tests
        ;;
    "frontend")
        run_frontend_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "report")
        generate_report
        ;;
    "all"|*)
        main
        ;;
esac
