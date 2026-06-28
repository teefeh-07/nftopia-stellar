import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getStellarConfig,
  type StellarRuntimeConfig,
} from '../config/stellar.config';

@Injectable()
export class SorobanRpcService implements OnModuleInit {
  private readonly logger = new Logger(SorobanRpcService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const config = this.getRuntimeConfig();

    this.logger.log(
      `Stellar network: ${config.network.toUpperCase()} | Horizon URL: ${config.horizonUrl} | Soroban RPC: ${config.sorobanRpcUrl}`,
    );

    await this.healthCheckHorizon(config);
  }

  getRuntimeConfig(): StellarRuntimeConfig {
    return getStellarConfig({
      ...process.env,
      STELLAR_NETWORK: this.configService.get<string>('STELLAR_NETWORK'),
      STELLAR_HORIZON_URL: this.configService.get<string>(
        'STELLAR_HORIZON_URL',
      ),
      SOROBAN_RPC_URL: this.configService.get<string>('SOROBAN_RPC_URL'),
      STELLAR_NETWORK_PASSPHRASE: this.configService.get<string>(
        'STELLAR_NETWORK_PASSPHRASE',
      ),
      STELLAR_TIMEOUT_DEFAULT_MS: this.configService.get<string>(
        'STELLAR_TIMEOUT_DEFAULT_MS',
      ),
      STELLAR_TIMEOUT_SIMULATION_MS: this.configService.get<string>(
        'STELLAR_TIMEOUT_SIMULATION_MS',
      ),
      STELLAR_TIMEOUT_SUBMISSION_MS: this.configService.get<string>(
        'STELLAR_TIMEOUT_SUBMISSION_MS',
      ),
      STELLAR_LOG_LEVEL: this.configService.get<string>('STELLAR_LOG_LEVEL'),
      STELLAR_OBFUSCATE_SENSITIVE_ERRORS: this.configService.get<string>(
        'STELLAR_OBFUSCATE_SENSITIVE_ERRORS',
      ),
    });
  }

  getNetworkContext() {
    const config = this.getRuntimeConfig();

    return {
      network: config.network,
      horizonUrl: config.horizonUrl,
      sorobanRpcUrl: config.sorobanRpcUrl,
      networkPassphrase: config.networkPassphrase,
    };
  }

  getTimeoutThreshold(requestKind: 'simulation' | 'submission' | 'default') {
    const config = this.getRuntimeConfig();

    if (requestKind === 'simulation') {
      return config.simulationTimeoutMs;
    }

    if (requestKind === 'submission') {
      return config.submissionTimeoutMs;
    }

    return config.defaultTimeoutMs;
  }

  inferRequestKind(methodName?: string) {
    if (!methodName) {
      return 'default' as const;
    }

    const normalized = methodName.toLowerCase();

    if (
      normalized.includes('simulate') ||
      normalized.includes('preview') ||
      normalized.includes('dryrun')
    ) {
      return 'simulation' as const;
    }

    if (
      normalized.includes('submit') ||
      normalized.includes('send') ||
      normalized.includes('invoke')
    ) {
      return 'submission' as const;
    }

    return 'default' as const;
  }

  private async healthCheckHorizon(
    config: StellarRuntimeConfig,
  ): Promise<void> {
    if (process.env.STELLAR_HORIZON_HEALTH_CHECK === 'false') {
      this.logger.warn(
        'Horizon health check skipped (STELLAR_HORIZON_HEALTH_CHECK=false).',
      );
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(`${config.horizonUrl}/`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(
          `Horizon returned HTTP ${response.status} ${response.statusText}`,
        );
      }

      this.logger.log(
        `Horizon health check passed: ${config.horizonUrl} is reachable.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown reachability error';
      const errorMessage = `Horizon health check failed for ${config.horizonUrl}: ${message}`;

      this.logger.error(errorMessage);

      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException(errorMessage);
      }
    }
  }
}
