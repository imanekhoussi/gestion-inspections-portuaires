export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}