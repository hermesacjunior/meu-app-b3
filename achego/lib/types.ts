// Tipos de dominio do Achego.
// A modelagem parte de um principio: todo dado sensivel (genero, orientacao,
// estado civil, localizacao) e DECLARADO pela propria pessoa, com opt-in.
// Nunca inferido ou coletado de terceiros.

export type Gender = 'mulher' | 'homem' | 'nao_binario' | 'outro';

export type Orientation =
  | 'hetero'
  | 'gay'
  | 'lesbica'
  | 'bi'
  | 'pan'
  | 'outro';

// Status de relacionamento que a propria pessoa declara ao entrar.
// Existe porque o app so faz sentido para quem esta disponivel — mas quem
// decide e a pessoa, sobre si mesma.
export type RelationshipStatus = 'solteiro' | 'recem_separado';

export type Profile = {
  id: string; // = auth.users.id
  display_name: string;
  bio: string | null;
  birthdate: string | null; // ISO date
  gender: Gender | null;
  orientation: Orientation | null;
  relationship_status: RelationshipStatus | null;
  // Regiao declarada (cidade/bairro), usada como filtro amplo.
  region: string | null;
  // Descoberta por proximidade so fica ativa se a pessoa consentir.
  location_sharing_enabled: boolean;
  latitude: number | null;
  longitude: number | null;
  // Aceites de consentimento (versao dos termos + timestamp).
  consent_version: string | null;
  consent_at: string | null;
  is_discoverable: boolean;
  created_at: string;
  updated_at: string;
};

export type DiscoveryFilters = {
  genders: Gender[];
  maxDistanceKm: number | null; // null = so filtro por regiao textual
  region: string | null;
  minAge: number;
  maxAge: number;
};

export type ConnectionStatus = 'pendente' | 'aceita' | 'recusada';

export type Connection = {
  id: string;
  requester_id: string;
  target_id: string;
  status: ConnectionStatus;
  created_at: string;
};
