import { IRudderAnalyticsConfig } from '@/Interface';
import * as rudderanalytics from 'rudder-sdk-js';

export function init(config: IRudderAnalyticsConfig) {
	rudderanalytics.load(config.key, config.url, { logLevel: 'DEBUG' });
	return rudderanalytics;
}
