import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SocialProvider } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { AuthUser } from '../common/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { SocialLoginDto } from './dto/social-login.dto';

type ProviderProfile = { providerId: string; email?: string; name: string; avatarUrl?: string };

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();

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
    return this.verifyKakao(dto.accessToken);
  }

  private async verifyGoogle(dto: SocialLoginDto): Promise<ProviderProfile> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new ServiceUnavailableException('Google 로그인 설정이 아직 완료되지 않았습니다.');

    if (dto.idToken) {
      const ticket = await this.googleClient.verifyIdToken({ idToken: dto.idToken, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload?.sub) throw new UnauthorizedException('Google 사용자 정보를 확인할 수 없습니다.');
      return { providerId: payload.sub, email: payload.email, name: payload.name ?? 'Licio 사용자', avatarUrl: payload.picture };
    }

    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${dto.accessToken}` },
    });
    if (!response.ok) throw new UnauthorizedException('Google 토큰이 유효하지 않습니다.');
    const payload = await response.json() as { sub?: string; email?: string; name?: string; picture?: string };
    if (!payload.sub) throw new UnauthorizedException('Google 사용자 정보를 확인할 수 없습니다.');
    return { providerId: payload.sub, email: payload.email, name: payload.name ?? 'Licio 사용자', avatarUrl: payload.picture };
  }

  private async verifyKakao(accessToken: string): Promise<ProviderProfile> {
    if (!process.env.KAKAO_REST_API_KEY) {
      throw new ServiceUnavailableException('Kakao 로그인 설정이 아직 완료되지 않았습니다.');
    }
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
}
