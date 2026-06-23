import { Injectable, Logger } from '@nestjs/common';

export type Academy = {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  rating?: number;
  distanceMeters: number;
};

const DEMO_ACADEMIES: Omit<Academy, 'distanceMeters'>[] = [
  { id: 'demo-gangnam', name: 'Licio 강남 운전전문학원', address: '서울특별시 강남구 테헤란로 152', latitude: 37.5008, longitude: 127.0365, phone: '02-0000-1001', rating: 4.6 },
  { id: 'demo-seoul', name: 'Licio 서울 자동차운전학원', address: '서울특별시 서초구 서초대로 74', latitude: 37.4915, longitude: 127.0074, phone: '02-0000-1002', rating: 4.4 },
  { id: 'demo-mapogu', name: 'Licio 마포 운전학원', address: '서울특별시 마포구 월드컵로 21', latitude: 37.5567, longitude: 126.9101, phone: '02-0000-1003', rating: 4.3 },
];

export function metersBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadius = 6371000;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = radians(lat2 - lat1);
  const deltaLng = radians(lng2 - lng1);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(deltaLng / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

@Injectable()
export class PlacesProvider {
  private readonly logger = new Logger(PlacesProvider.name);

  async nearby(lat: number, lng: number, radius: number): Promise<{ academies: Academy[]; source: 'google' | 'demo' }> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return { academies: this.fromDemo(lat, lng, radius), source: 'demo' };

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.rating',
        },
        body: JSON.stringify({
          includedTypes: ['driving_school'],
          maxResultCount: 20,
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
        }),
      });
      if (!response.ok) throw new Error(`Google Places returned ${response.status}`);
      const payload = await response.json() as { places?: Array<{ id: string; displayName?: { text?: string }; formattedAddress?: string; location?: { latitude?: number; longitude?: number }; nationalPhoneNumber?: string; rating?: number }> };
      const academies = (payload.places ?? [])
        .filter((place) => place.location?.latitude !== undefined && place.location?.longitude !== undefined)
        .map((place) => ({
          id: place.id,
          name: place.displayName?.text ?? '이름 없는 운전학원',
          address: place.formattedAddress,
          latitude: place.location!.latitude!,
          longitude: place.location!.longitude!,
          phone: place.nationalPhoneNumber,
          rating: place.rating,
          distanceMeters: metersBetween(lat, lng, place.location!.latitude!, place.location!.longitude!),
        }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
      return { academies, source: 'google' };
    } catch (error) {
      this.logger.warn(`Google Places unavailable; returning demo results. ${String(error)}`);
      return { academies: this.fromDemo(lat, lng, radius), source: 'demo' };
    }
  }

  private fromDemo(lat: number, lng: number, radius: number) {
    return DEMO_ACADEMIES
      .map((academy) => ({ ...academy, distanceMeters: metersBetween(lat, lng, academy.latitude, academy.longitude) }))
      .filter((academy) => academy.distanceMeters <= Math.max(radius, 5000))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}
