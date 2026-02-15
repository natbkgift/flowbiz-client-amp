let token: string | null = null;

export function setToken(nextToken: string | null) {
  token = nextToken;
}

export function getToken(): string | null {
  return token;
}
