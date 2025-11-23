export interface RouteConfig {
  provider: string;
  model: string;
  temperature?: number;
}

export class LLMRouter {
  private routes: Map<string, RouteConfig> = new Map();
  private defaultRoute: RouteConfig = { provider: 'openai', model: 'gpt-4' };

  registerRoute(taskType: string, config: RouteConfig): void {
    this.routes.set(taskType, config);
  }

  getRoute(taskType: string): RouteConfig {
    return this.routes.get(taskType) || this.defaultRoute;
  }

  setDefaultRoute(config: RouteConfig): void {
    this.defaultRoute = config;
  }

  routePrompt(prompt: string): RouteConfig {
    // Simple logic: if prompt is short, use faster model. If explicit route, use it.
    if (prompt.length < 50) {
      return { provider: 'openai', model: 'gpt-3.5-turbo' };
    }
    return this.defaultRoute;
  }
}
