// Shared configuration for LocalLoop load tests

export const environments = {
  local: {
    baseUrl: 'http://localhost:3000',
    // More lenient thresholds for dev environment
    thresholds: {
      basic: {
        'http_req_duration': ['p(95)<3000'],
        'http_req_failed': ['rate<0.15'], 
      },
      extended: {
        'http_req_duration': ['p(95)<4000'],
        'http_req_failed': ['rate<0.20'], 
      },
      stress: {
        'http_req_duration': ['p(95)<6000'],
        'http_req_failed': ['rate<0.30'], 
      },
      spike: {
        'http_req_duration': ['p(95)<5000'],
        'http_req_failed': ['rate<0.25'], 
      }
    }
  },
  staging: {
    baseUrl: 'https://staging.localloop.app',
    thresholds: {
      basic: {
        'http_req_duration': ['p(95)<2000'],
        'http_req_failed': ['rate<0.10'], 
      },
      extended: {
        'http_req_duration': ['p(95)<3000'],
        'http_req_failed': ['rate<0.15'], 
      },
      stress: {
        'http_req_duration': ['p(95)<5000'],
        'http_req_failed': ['rate<0.25'], 
      },
      spike: {
        'http_req_duration': ['p(95)<4000'],
        'http_req_failed': ['rate<0.20'], 
      }
    }
  },
  production: {
    baseUrl: 'https://localloop.app',
    // Strict thresholds for production
    thresholds: {
      basic: {
        'http_req_duration': ['p(95)<1500'],
        'http_req_failed': ['rate<0.05'], 
      },
      extended: {
        'http_req_duration': ['p(95)<2500'],
        'http_req_failed': ['rate<0.10'], 
      },
      stress: {
        'http_req_duration': ['p(95)<4000'],
        'http_req_failed': ['rate<0.20'], 
      },
      spike: {
        'http_req_duration': ['p(95)<3500'],
        'http_req_failed': ['rate<0.15'], 
      }
    }
  }
};

// Get environment configuration
export function getConfig(env = 'local') {
  const envConfig = environments[env];
  if (!envConfig) {
    throw new Error(`Unknown environment: ${env}. Available: ${Object.keys(environments).join(', ')}`);
  }
  return envConfig;
}

// Get base URL from environment variable or default
export function getBaseUrl(fallback = 'local') {
  return __ENV.BASE_URL || environments[fallback].baseUrl;
}

// Common test data
export const testData = {
  // Sample event IDs that should exist in the system
  sampleEventIds: ['1', '2', '3'],
  
  // Test user data for registration flows - using centralized test accounts
  testUsers: [
    {
      email: 'test1@localloopevents.xyz',
      name: 'Test User',
      phone: '+447400123456',
      password: 'zunTom-9wizri-refdes'
    },
    {
      email: 'teststaff1@localloopevents.xyz', 
      name: 'Test Staff',
      phone: '+447400123457',
      password: 'bobvip-koDvud-wupva0'
    },
    {
      email: 'testadmin1@localloopevents.xyz',
      name: 'Test Admin', 
      phone: '+447400123458',
      password: 'nonhyx-1nopta-mYhnum'
    }
  ],
  
  // Common headers
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-load-test/1.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
  
  // Realistic think times (in seconds)
  thinkTimes: {
    quick: () => Math.random() * 1 + 0.5,      // 0.5-1.5s  
    normal: () => Math.random() * 2 + 1,       // 1-3s
    slow: () => Math.random() * 5 + 2,         // 2-7s
  }
};

// Utility functions
export const utils = {
  // Generate random string for testing
  randomString: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // Generate random email
  randomEmail: () => `test-${utils.randomString(8)}@example.com`,
  
  // Generate random phone number
  randomPhone: () => `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
  
  // Weighted random selection
  weightedRandom: (items) => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const item of items) {
      cumulativeWeight += item.weight;
      if (random <= cumulativeWeight) {
        return item;
      }
    }
    return items[0]; // Fallback
  }
};

const loadTestConfig = {
  environments,
  getConfig,
  getBaseUrl,
  testData,
  utils
};

export default loadTestConfig;