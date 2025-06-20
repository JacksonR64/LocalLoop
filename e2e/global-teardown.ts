import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
    console.log('🧹 Starting global test teardown...');

    try {
        // Clean up test data if any was created
        // This is where you would remove test users, events, etc.
        console.log('🗑️  Cleaning up test data...');
        console.log(`Test config workers: ${config.workers}, projects: ${config.projects.length}`);

        // Clean up any temporary files or state
        console.log('📁 Cleaning up temporary files...');

        // Log test completion
        console.log('📊 Test run completed');

    } catch (error) {
        console.error('❌ Global teardown failed:', error);
        // Don't throw error to avoid masking test failures
        console.warn('⚠️  Continuing despite teardown errors');
    }

    console.log('✅ Global test teardown completed');
}

export default globalTeardown; 