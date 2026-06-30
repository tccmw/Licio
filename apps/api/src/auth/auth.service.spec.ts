import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateKeyPairSync, sign } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

type AppleProfile = { providerId: string; email?: string; name: string };
type AppleVerifier = { verifyApple: (idToken?: string) => Promise<AppleProfile> };

describe('AuthService Apple token verification', () => {
  const originalFetch = global.fetch;
  const originalClientId = process.env.APPLE_CLIENT_ID;
  const clientId = 'com.licio.app';
  const keyId = 'licio-test-key';
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

  const createToken = (audience: string) => {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: keyId })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: 'https://appleid.apple.com',
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 300,
      sub: 'apple-user-id',
      email: 'driver@example.com',
    })).toString('base64url');
    const signature = sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), privateKey).toString('base64url');
    return `${header}.${payload}.${signature}`;
  };

  const createService = () => new AuthService({} as PrismaService, {} as JwtService) as unknown as AppleVerifier;

  beforeEach(() => {
    process.env.APPLE_CLIENT_ID = clientId;
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      keys: [{ ...publicKey.export({ format: 'jwk' }), kid: keyId, alg: 'RS256', use: 'sig' }],
    }), { status: 200 }));
  });

  afterAll(() => {
    global.fetch = originalFetch;
    if (originalClientId === undefined) delete process.env.APPLE_CLIENT_ID;
    else process.env.APPLE_CLIENT_ID = originalClientId;
  });

  it('accepts a signed identity token for the configured iOS bundle', async () => {
    await expect(createService().verifyApple(createToken(clientId))).resolves.toEqual({
      providerId: 'apple-user-id',
      email: 'driver@example.com',
      name: 'driver',
    });
  });

  it('rejects an identity token issued for another app', async () => {
    await expect(createService().verifyApple(createToken('com.example.other'))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
