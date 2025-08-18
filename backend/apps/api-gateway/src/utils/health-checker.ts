import axios from 'axios';
import { services, config } from '../config/services';
import { logger } from './logger';

export interface ServiceHealth {
  healthy: boolean;
  lastCheck: Date;
  responseTime?: number;
  error?: string;
  consecutiveFailures: number;
}

export class HealthChecker {
  private serviceHealthStatus: Map<string, ServiceHealth> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    // Initialize all services as healthy
    services.forEach(service => {
      this.serviceHealthStatus.set(service.name, {
        healthy: true,
        lastCheck: new Date(),
        consecutiveFailures: 0,
      });
    });

    // Start periodic health checks
    this.startHealthChecks();
  }

  /**
   * Start periodic health checks for all services
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllServices();
    }, config.healthCheck.interval);

    logger.info('Health checker started', {
      interval: config.healthCheck.interval,
      services: services.length,
    });
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      logger.info('Health checker stopped');
    }
  }

  /**
   * Check health of all services
   */
  async checkAllServices(): Promise<Record<string, ServiceHealth>> {
    const healthChecks = services.map(service => this.checkServiceHealth(service.name));
    await Promise.allSettled(healthChecks);

    const healthStatus: Record<string, ServiceHealth> = {};
    this.serviceHealthStatus.forEach((health, serviceName) => {
      healthStatus[serviceName] = { ...health };
    });

    return healthStatus;
  }

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const service = services.find(s => s.name === serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const currentStatus = this.serviceHealthStatus.get(serviceName);
    const startTime = Date.now();

    try {
      const response = await axios.get(`${service.url}${service.healthCheck}`, {
        timeout: config.healthCheck.timeout,
        headers: {
          'User-Agent': 'API-Gateway-Health-Checker',
        },
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status === 200 && response.data?.success === true;

      const newStatus: ServiceHealth = {
        healthy: isHealthy,
        lastCheck: new Date(),
        responseTime,
        consecutiveFailures: isHealthy ? 0 : (currentStatus?.consecutiveFailures || 0) + 1,
      };

      this.serviceHealthStatus.set(serviceName, newStatus);

      if (isHealthy && currentStatus?.healthy === false) {
        logger.info('Service recovered', {
          service: serviceName,
          responseTime,
          downTime: currentStatus.lastCheck,
        });
      }

      return newStatus;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const consecutiveFailures = (currentStatus?.consecutiveFailures || 0) + 1;

      const newStatus: ServiceHealth = {
        healthy: false,
        lastCheck: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        consecutiveFailures,
      };

      this.serviceHealthStatus.set(serviceName, newStatus);

      // Log error if service just went down or every 10 failures
      if (currentStatus?.healthy === true || consecutiveFailures % 10 === 0) {
        logger.error('Service health check failed', {
          service: serviceName,
          error: error instanceof Error ? error.message : String(error),
          consecutiveFailures,
          responseTime,
        });
      }

      return newStatus;
    }
  }

  /**
   * Check if a service is healthy
   */
  async isServiceHealthy(serviceName: string): Promise<boolean> {
    const status = this.serviceHealthStatus.get(serviceName);
    
    if (!status) {
      // If no status available, perform immediate check
      const health = await this.checkServiceHealth(serviceName);
      return health.healthy;
    }

    // Use circuit breaker logic
    if (status.consecutiveFailures >= config.circuitBreaker.failureThreshold) {
      // Circuit is open, check if enough time has passed to try again
      const timeSinceLastCheck = Date.now() - status.lastCheck.getTime();
      if (timeSinceLastCheck < config.circuitBreaker.timeout) {
        return false;
      }
      
      // Try to close circuit with a new health check
      const health = await this.checkServiceHealth(serviceName);
      return health.healthy;
    }

    return status.healthy;
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName: string): ServiceHealth | undefined {
    return this.serviceHealthStatus.get(serviceName);
  }

  /**
   * Mark service as down (for immediate circuit breaking)
   */
  markServiceDown(serviceName: string): void {
    const currentStatus = this.serviceHealthStatus.get(serviceName);
    
    if (currentStatus) {
      const newStatus: ServiceHealth = {
        ...currentStatus,
        healthy: false,
        lastCheck: new Date(),
        consecutiveFailures: currentStatus.consecutiveFailures + 1,
      };
      
      this.serviceHealthStatus.set(serviceName, newStatus);
    }
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    healthy: boolean;
    totalServices: number;
    healthyServices: number;
    unhealthyServices: string[];
  } {
    const healthyServices = Array.from(this.serviceHealthStatus.entries())
      .filter(([_, status]) => status.healthy);
    
    const unhealthyServices = Array.from(this.serviceHealthStatus.entries())
      .filter(([_, status]) => !status.healthy)
      .map(([name, _]) => name);

    return {
      healthy: unhealthyServices.length === 0,
      totalServices: services.length,
      healthyServices: healthyServices.length,
      unhealthyServices,
    };
  }
}
