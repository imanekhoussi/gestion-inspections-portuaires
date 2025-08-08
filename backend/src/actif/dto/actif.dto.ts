import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateActifDto {
  @ApiProperty({ description: 'Site where the asset is located', example: 'Port de Tanger Med' })
  @IsString()
  @IsNotEmpty()
  site: string;

  @ApiProperty({ description: 'Specific zone within the site', example: 'Terminal 1' })
  @IsString()
  @IsNotEmpty()
  zone: string;

  @ApiProperty({ description: 'Type of structure', example: 'Quai d\'accostage' })
  @IsString()
  @IsNotEmpty()
  ouvrage: string;

  @ApiProperty({ description: 'Name of the asset', example: 'Grue mobile A1' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Unique code for the asset', example: 'GM-A1-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'ID of the group the asset belongs to' })
  @IsNumber()
  idGroupe: number;

  @ApiProperty({ description: 'Condition index (1=critical, 5=excellent)', required: false, default: 3 })
  @IsOptional()
  @IsNumber()
  indiceEtat?: number;

  @ApiProperty({
    description: "The type of geometry drawn on the map.",
    enum: ['Point', 'LineString', 'Polygon'],
    required: false
  })
  @IsOptional()
  @IsString()
  @IsIn(['Point', 'LineString', 'Polygon'])
  geometryType?: 'Point' | 'LineString' | 'Polygon';

  @ApiProperty({
    description: "The array of coordinates for the geometry in WGS84 (EPSG:4326).",
    required: false
  })
  @IsOptional()
  @IsArray()
  coordinates?: any[];
}

export class UpdateActifDto extends PartialType(CreateActifDto) {}