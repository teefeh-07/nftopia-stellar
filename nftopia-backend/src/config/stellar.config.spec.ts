import { getStellarConfig, validateHorizonUrl } from './stellar.config';

describe('validateHorizonUrl', () => {
  it('normalizes trailing slashes', () => {
    expect(
      validateHorizonUrl('https://horizon.stellar.org/', 'mainnet'),
    ).toBe('https://horizon.stellar.org');
  });

  it('accepts a valid mainnet URL when network is mainnet', () => {
    expect(
      validateHorizonUrl('https://horizon.stellar.org', 'mainnet'),
    ).toBe('https://horizon.stellar.org');
  });

  it('accepts a valid testnet URL when network is testnet', () => {
    expect(
      validateHorizonUrl('https://horizon-testnet.stellar.org', 'testnet'),
    ).toBe('https://horizon-testnet.stellar.org');
  });

  it('rejects an invalid URL format', () => {
    expect(() => validateHorizonUrl('not-a-url', 'mainnet')).toThrow(
      'STELLAR_HORIZON_URL is not a valid URL',
    );
  });

  it('rejects unsupported protocols', () => {
    expect(() =>
      validateHorizonUrl('ftp://horizon.stellar.org', 'mainnet'),
    ).toThrow('STELLAR_HORIZON_URL must use http or https protocol');
  });

  it('rejects testnet URL when network is mainnet', () => {
    expect(() =>
      validateHorizonUrl('https://horizon-testnet.stellar.org', 'mainnet'),
    ).toThrow(
      'Network mismatch: STELLAR_HORIZON_URL (https://horizon-testnet.stellar.org) points to testnet but STELLAR_NETWORK is mainnet.',
    );
  });

  it('rejects mainnet URL when network is testnet', () => {
    expect(() =>
      validateHorizonUrl('https://horizon.stellar.org', 'testnet'),
    ).toThrow(
      'Network mismatch: STELLAR_HORIZON_URL (https://horizon.stellar.org) points to mainnet but STELLAR_NETWORK is testnet.',
    );
  });

  it('rejects localhost in production', () => {
    expect(() =>
      validateHorizonUrl('http://localhost:8000', 'testnet', {
        NODE_ENV: 'production',
      } as NodeJS.ProcessEnv),
    ).toThrow('STELLAR_HORIZON_URL cannot point to localhost in production');
  });

  it('allows localhost outside production', () => {
    expect(
      validateHorizonUrl('http://localhost:8000', 'testnet', {
        NODE_ENV: 'development',
      } as NodeJS.ProcessEnv),
    ).toBe('http://localhost:8000');
  });
});

describe('getStellarConfig', () => {
  const baseEnv = {
    NODE_ENV: 'development',
    STELLAR_NETWORK: 'TESTNET',
  };

  it('returns defaults for testnet when no overrides are set', () => {
    const config = getStellarConfig(baseEnv);

    expect(config.network).toBe('testnet');
    expect(config.horizonUrl).toBe('https://horizon-testnet.stellar.org');
  });

  it('returns defaults for mainnet when no overrides are set', () => {
    const config = getStellarConfig({
      ...baseEnv,
      STELLAR_NETWORK: 'MAINNET',
    });

    expect(config.network).toBe('mainnet');
    expect(config.horizonUrl).toBe('https://horizon.stellar.org');
  });

  it('uses the provided STELLAR_HORIZON_URL', () => {
    const config = getStellarConfig({
      ...baseEnv,
      STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
    });

    expect(config.horizonUrl).toBe('https://horizon-testnet.stellar.org');
  });

  it('throws in production when STELLAR_HORIZON_URL is missing', () => {
    expect(() =>
      getStellarConfig({
        NODE_ENV: 'production',
        STELLAR_NETWORK: 'MAINNET',
      }),
    ).toThrow('STELLAR_HORIZON_URL is required in production');
  });

  it('throws in production when STELLAR_NETWORK is not mainnet', () => {
    expect(() =>
      getStellarConfig({
        NODE_ENV: 'production',
        STELLAR_NETWORK: 'TESTNET',
        STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
      }),
    ).toThrow('STELLAR_NETWORK must be set to mainnet in production');
  });

  it('throws in production when Horizon URL points to testnet', () => {
    expect(() =>
      getStellarConfig({
        NODE_ENV: 'production',
        STELLAR_NETWORK: 'MAINNET',
        STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
      }),
    ).toThrow('Network mismatch');
  });

  it('throws when mainnet config uses a testnet Horizon URL', () => {
    expect(() =>
      getStellarConfig({
        ...baseEnv,
        STELLAR_NETWORK: 'MAINNET',
        STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
      }),
    ).toThrow('Network mismatch');
  });

  it('throws when testnet config uses a mainnet Horizon URL', () => {
    expect(() =>
      getStellarConfig({
        ...baseEnv,
        STELLAR_NETWORK: 'TESTNET',
        STELLAR_HORIZON_URL: 'https://horizon.stellar.org',
      }),
    ).toThrow('Network mismatch');
  });
});
