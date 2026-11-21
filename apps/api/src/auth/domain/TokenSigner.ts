export type TokenClaims = {
  userId: string;
  sessionId: string;
  expiresAt: Date;
};

export type TokenSigner = {
  sign: (claims: TokenClaims) => Promise<string>;
  verify: (token: string) => Promise<TokenClaims | null>;
};
