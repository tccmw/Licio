import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SocialProvider } from '@prisma/client';
import { createPublicKey, verify as verifySignature, type JsonWebKey } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { AuthUser } from '../common/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { SocialLoginDto } from './dto/social-login.dto';

type ProviderProfile = { providerId: string; email?: string; name: string; avatarUrl?: string };
type AppleJwtHeader = { alg?: string; kid?: string };
type AppleJwtPayload = { iss?: string; aud?: string | string[]; exp?: number; sub?: string; email?: string };
type ApplePublicKey = JsonWebKey & { kid?: string };

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();
  private readonly applePublicKeys = new Map<string, ApplePublicKey>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signIn(dto: SocialLoginDto) {
    const profile = await this.verifyProviderToken(dto);
    const user = await this.findOrCreateUser(dto.provider, profile);
    return this.issueTokens({ sub: user.id, email: user.email ?? undefined, name: user.name }, user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<AuthUser>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.issueTokens({ sub: user.id, email: user.email ?? undefined, name: user.name }, user);
    } catch {
      throw new UnauthorizedException('유효하지 않은 갱신 토큰입니다.');
    }
  }

  private async findOrCreateUser(provider: SocialProvider, profile: ProviderProfile) {
    const account = await this.prisma.socialAccount.findUnique({
      where: { provider_providerId: { provider, providerId: profile.providerId } },
      include: { user: true },
    });
    if (account) return account.user;

    const existingUser = profile.email
      ? await this.prisma.user.findUnique({ where: { email: profile.email } })
      : null;
    const user = existingUser ?? await this.prisma.user.create({
      data: { name: profile.name, email: profile.email, avatarUrl: profile.avatarUrl },
    });
    await this.prisma.socialAccount.create({ data: { provider, providerId: profile.providerId, userId: user.id } });
    return user;
  }

  private async issueTokens(payload: AuthUser, user: { id: string; name: string; email: string | null; avatarUrl: string | null }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' }),
      this.jwt.signAsync(payload, { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '30d' }),
    ]);
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    };
  }

  private async verifyProviderToken(dto: SocialLoginDto): Promise<ProviderProfile> {
    if (dto.provider === SocialProvider.GOOGLE) return this.verifyGoogle(dto);
    if (dto.provider === SocialProvider.KAKAO) return this.verifyKakao(dto);
    return this.verifyApple(dto.idToken ?? dto.accessToken);
  }

  private async verifyGoogle(dto: SocialLoginDto): Promise<ProviderProfile> {
    const clientIds = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
    ].flatMap((value) => value?.split(',') ?? []).map((value) => value.trim()).filter(Boolean);
    if (clientIds.length === 0) throw new ServiceUnavailableException('Google 로그인 설정이 아직 완료되지 않았습니다.');

    if (dto.idToken) {
      const ticket = await this.googleClient.verifyIdToken({ idToken: dto.idToken, audience: clientIds });
      const payload = ticket.getPayload();
      if (!payload?.sub) throw new UnauthorizedException('Google 사용자 정보를 확인할 수 없습니다.');
      return { providerId: payload.sub, email: payload.email, name: payload.name ?? 'Licio 사용자', avatarUrl: payload.picture };
    }

    if (!dto.accessToken) throw new UnauthorizedException('Google 인증 토큰이 필요합니다.');

    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${dto.accessToken}` },
    });
    if (!response.ok) throw new UnauthorizedException('Google 토큰이 유효하지 않습니다.');
    const payload = await response.json() as { sub?: string; email?: string; name?: string; picture?: string };
    if (!payload.sub) throw new UnauthorizedException('Google 사용자 정보를 확인할 수 없습니다.');
    return { providerId: payload.sub, email: payload.email, name: payload.name ?? 'Licio 사용자', avatarUrl: payload.picture };
  }

  private async verifyKakao(dto: SocialLoginDto): Promise<ProviderProfile> {
    if (!process.env.KAKAO_REST_API_KEY) {
      throw new ServiceUnavailableException('Kakao 로그인 설정이 아직 완료되지 않았습니다.');
    }
    const accessToken = dto.accessToken;
    if (!accessToken) throw new UnauthorizedException('Kakao 인증 토큰이 필요합니다.');

    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new UnauthorizedException('Kakao 토큰이 유효하지 않습니다.');
    const payload = await response.json() as {
      id?: number;
      properties?: { nickname?: string; profile_image?: string };
      kakao_account?: { email?: string };
    };
    if (!payload.id) throw new UnauthorizedException('Kakao 사용자 정보를 확인할 수 없습니다.');
    return {
      providerId: String(payload.id),
      email: payload.kakao_account?.email,
      name: payload.properties?.nickname ?? 'Licio 사용자',
      avatarUrl: payload.properties?.profile_image,
    };
  }

  private async verifyApple(idToken?: string): Promise<ProviderProfile> {
    const clientIds = (process.env.APPLE_CLIENT_ID ?? '').split(',').map((value) => value.trim()).filter(Boolean);
    if (clientIds.length === 0) throw new ServiceUnavailableException('Apple 로그인 설정이 아직 완료되지 않았습니다.');
    if (!idToken) throw new UnauthorizedException('Apple identity token이 필요합니다.');

    const segments = idToken.split('.');
    if (segments.length !== 3) throw new UnauthorizedException('Apple identity token 형식이 올바르지 않습니다.');

    let header: AppleJwtHeader;
    let payload: AppleJwtPayload;
    try {
      header = JSON.parse(Buffer.from(segments[0], 'base64url').toString('utf8')) as AppleJwtHeader;
      payload = JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8')) as AppleJwtPayload;
    } catch {
      throw new UnauthorizedException('Apple identity token을 해석할 수 없습니다.');
    }

    if (header.alg !== 'RS256' || !header.kid || !payload.sub) {
      throw new UnauthorizedException('Apple identity token 정보가 올바르지 않습니다.');
    }
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const isValidClaims = payload.iss === 'https://appleid.apple.com'
      && audiences.some((audience) => Boolean(audience && clientIds.includes(audience)))
      && typeof payload.exp === 'number'
      && payload.exp > Math.floor(Date.now() / 1000);
    if (!isValidClaims) throw new UnauthorizedException('Apple identity token이 만료되었거나 대상 앱이 다릅니다.');

    const publicKey = await this.getApplePublicKey(header.kid);
    const verified = verifySignature(
      'RSA-SHA256',
      Buffer.from(`${segments[0]}.${segments[1]}`),
      createPublicKey({ key: publicKey, format: 'jwk' }),
      Buffer.from(segments[2], 'base64url'),
    );
    if (!verified) throw new UnauthorizedException('Apple identity token 서명이 유효하지 않습니다.');

    return {
      providerId: payload.sub,
      email: payload.email,
      name: payload.email?.split('@')[0] ?? 'Licio 사용자',
    };
  }

  private async getApplePublicKey(keyId: string): Promise<ApplePublicKey> {
    const cached = this.applePublicKeys.get(keyId);
    if (cached) return cached;

    const response = await fetch('https://appleid.apple.com/auth/keys');
    if (!response.ok) throw new ServiceUnavailableException('Apple 공개 키를 불러오지 못했습니다.');
    const payload = await response.json() as { keys?: ApplePublicKey[] };
    for (const key of payload.keys ?? []) {
      if (key.kid) this.applePublicKeys.set(key.kid, key);
    }
    const publicKey = this.applePublicKeys.get(keyId);
    if (!publicKey) throw new UnauthorizedException('Apple identity token 공개 키를 찾을 수 없습니다.');
    return publicKey;
  }
}
