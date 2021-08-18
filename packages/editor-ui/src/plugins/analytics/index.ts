import _Vue from "vue";
import { IDataObject } from 'n8n-workflow';
import * as rudderAnalytics from './rudderanalytics';
import { IRudderAnalyticsConfig } from "@/Interface";

declare module 'vue/types/vue' {
	interface Vue {
		$analytics: Analytics;
	}
}

export function AnalyticsPlugin(vue: typeof _Vue, options: IDataObject): void {
	const analytics = new Analytics(options);
	Object.defineProperty(vue, '$analytics', {
		get() { return analytics; },
	});
	Object.defineProperty(vue.prototype, '$analytics', {
		get() { return analytics; },
	});
}

class Analytics {

	private analytics?: any; // tslint:disable-line:no-any

	constructor(options: IDataObject) {
		if(options.enabled) {
			this.analytics = rudderAnalytics.init(options.config! as IRudderAnalyticsConfig);
		}
	}

	identify(event: string, properties?: IDataObject) {
		if (this.analytics) {
			this.analytics.identify(event, properties);
		}
	}

	track(event: string, properties?: IDataObject) {
		if (this.analytics) {
			this.analytics.track(event, properties);
		}
	}
}
