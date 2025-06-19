# LocalLoop Load Testing Suite

This directory contains a comprehensive load testing suite for the LocalLoop event management application using k6, a modern load testing tool designed for developers.

## Overview

Our load testing suite includes four different test types to thoroughly evaluate LocalLoop's performance characteristics:

### 📊 Test Types

1. **Basic Load Test** (`basic-load-test.js`)
   - **Purpose**: Baseline performance testing with moderate, realistic load
   - **Load Pattern**: 10-20 concurrent users over 4 minutes
   - **Use Case**: Daily performance validation and CI/CD integration

2. **Extended Load Test** (`extended-load-test.js`)  
   - **Purpose**: Complex user journeys including RSVP and ticket purchasing flows
   - **Load Pattern**: 5-25 concurrent users over 9 minutes with realistic scenarios
   - **Use Case**: End-to-end performance validation before releases

3. **Stress Test** (`stress-test.js`)
   - **Purpose**: Find the breaking point and maximum capacity
   - **Load Pattern**: Progressive load increase up to 250 concurrent users
   - **Use Case**: Infrastructure planning and capacity validation

4. **Spike Test** (`spike-test.js`)
   - **Purpose**: Test autoscaling and resilience during sudden traffic spikes
   - **Load Pattern**: Sudden spikes from 10 to 200+ users
   - **Use Case**: Production readiness for viral events or marketing campaigns

## 🚀 Quick Start

### Prerequisites

1. **Install k6**:
   ```bash
   # macOS (using Homebrew)
   brew install k6
   
   # Linux (using package managers)
   sudo apt-get install k6  # Ubuntu/Debian
   
   # Windows (using Chocolatey)
   choco install k6
   
   # Or download from https://k6.io/docs/getting-started/installation/
   ```

2. **Ensure LocalLoop is running**:
   ```bash
   npm run dev  # or npm start for production mode
   ```

### Running Tests

All tests can be run using npm scripts or directly with k6:

```bash
# Using npm scripts (recommended)
npm run load-test          # Basic load test
npm run load-test-extended # Extended scenarios  
npm run load-test-stress   # Stress testing
npm run load-test-spike    # Spike testing

# Or run directly with k6
k6 run tests/load/basic-load-test.js
k6 run tests/load/extended-load-test.js
k6 run tests/load/stress-test.js
k6 run tests/load/spike-test.js
```

### Environment Configuration

Set the base URL for different environments:

```bash
# Local development (default)
BASE_URL=http://localhost:3000 npm run load-test

# Staging environment
BASE_URL=https://staging.localloopevents.xyz npm run load-test

# Production (use with extreme caution!)
BASE_URL=https://localloopevents.xyz npm run load-test
```

## 📈 Understanding Results

### Key Metrics

- **http_req_duration**: Response time metrics (avg, p95, p99)
- **http_req_failed**: Percentage of failed requests
- **http_reqs**: Total number of requests made
- **vus**: Virtual Users (concurrent connections)

### Performance Thresholds

| Test Type | p95 Response Time | Error Rate | Purpose |
|-----------|------------------|------------|---------|
| Basic     | < 2000ms        | < 10%      | Daily validation |
| Extended  | < 3000ms        | < 15%      | Release readiness |
| Stress    | < 5000ms        | < 25%      | Capacity planning |
| Spike     | < 4000ms        | < 20%      | Resilience testing |

### Reading the Output

Each test provides:
- ✅ **Green indicators**: Performance is excellent
- 🟡 **Yellow indicators**: Performance is acceptable but watch for trends  
- 🔴 **Red indicators**: Performance issues that need attention

## 🎯 Test Scenarios

### Basic Load Test
- Homepage loading
- Event browsing  
- API endpoint testing
- Authentication page access

### Extended Load Test
- Complete user registration flow
- Event RSVP process
- Ticket purchasing simulation
- Event creation workflows
- Search and filtering operations

### Stress Test
- Progressive load increase
- Breaking point identification
- Resource exhaustion testing
- Recovery validation

### Spike Test
- Sudden traffic spikes
- Autoscaling behavior
- Circuit breaker testing
- Performance degradation analysis

## 📊 Results Storage

Test results are automatically saved to `tests/load/results/`:

- `basic-load-test-results.json`: Basic test detailed metrics
- `extended-load-test-results.json`: Extended test metrics
- `stress-test-results.json`: Stress test analysis
- `spike-test-results.json`: Spike test resilience data

## 🔧 Customization

### Modifying Load Patterns

Edit the `options.stages` array in any test file:

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users over 30s
    { duration: '1m', target: 10 },   // Stay at 10 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
};
```

### Adding New Endpoints

Add endpoints to test in the endpoint arrays:

```javascript
const endpoints = [
  '/',
  '/events/new-endpoint',
  '/api/new-feature',
];
```

### Custom Thresholds

Modify performance expectations:

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% under 1.5s
    http_req_failed: ['rate<0.05'],    // Less than 5% errors
  },
};
```

## 🚨 Production Testing Guidelines

### Safety First
- **Never run stress/spike tests against production** without explicit approval
- Start with low load and gradually increase
- Monitor production metrics during tests
- Have a rollback plan ready

### Best Practices
1. **Coordinate with team**: Inform stakeholders before load testing
2. **Monitor infrastructure**: Watch CPU, memory, database connections
3. **Test during low-traffic periods**: Minimize user impact
4. **Use staging environment**: Mirror production setup for realistic results
5. **Baseline first**: Establish performance benchmarks before optimization

## 🔍 Troubleshooting

### Common Issues

**High Error Rates**:
- Check if application is running
- Verify database connections
- Look for rate limiting
- Monitor resource utilization

**Slow Response Times**:
- Check database query performance  
- Monitor Next.js server response times
- Verify Supabase connection pooling
- Review caching strategies

**Test Failures**:
- Ensure k6 is properly installed
- Check network connectivity
- Verify BASE_URL is correct
- Review test logs for specific errors

### Debugging Commands

```bash
# Run with verbose output
k6 run --verbose tests/load/basic-load-test.js

# Run with custom duration
k6 run --duration 30s tests/load/basic-load-test.js

# Run with fewer virtual users
k6 run --vus 5 tests/load/basic-load-test.js
```

## 📋 CI/CD Integration

Add load testing to your deployment pipeline:

```yaml
# Example GitHub Actions step
- name: Load Test
  run: |
    npm run load-test
    # Parse results and fail if thresholds exceeded
```

## 🎯 Performance Targets

Based on LocalLoop's requirements:

| Metric | Target | Rationale |
|--------|--------|-----------|
| Homepage Load | < 1.5s | First impression critical |
| Event Details | < 2.0s | Core user journey |
| RSVP Process | < 3.0s | Acceptable for transactional flow |
| Search Results | < 2.5s | User experience expectation |
| API Responses | < 1.0s | Frontend performance dependency |

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/)
- [Performance Testing Patterns](https://k6.io/docs/test-types/)
- [LocalLoop Performance Monitoring](../analytics/performance/README.md)

---

**Note**: Always test responsibly and consider the impact on your infrastructure and users. Load testing is a powerful tool for ensuring performance, but should be used thoughtfully and safely. 