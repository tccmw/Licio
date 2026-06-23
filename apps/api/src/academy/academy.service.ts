import { Injectable } from '@nestjs/common';
import { NearbyAcademiesDto } from './dto/nearby-academies.dto';
import { PlacesProvider } from './places.provider';

@Injectable()
export class AcademyService {
  constructor(private readonly places: PlacesProvider) {}

  async findNearby(query: NearbyAcademiesDto) {
    const result = await this.places.nearby(query.lat, query.lng, query.radius ?? 5000);
    return {
      ...result,
      searchedAt: new Date().toISOString(),
      locationStored: false,
    };
  }
}
