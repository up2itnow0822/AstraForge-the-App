import { envLoader } from './envLoader';
import { logger } from './logger';

async function testSecrets() {
  try {
    console.log('Testing envLoader secrets integration...');
    await envLoader.loadSecrets();
    const validation = envLoader.validate();
    console.log('Validation:', validation);
    console.log('Config summary:', envLoader.getConfigSummary());
    logger.info('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
    logger.error('Test failed:', error);
  }
}

testSecrets();
