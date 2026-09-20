export type AuthenticatedUser = {
  id: string;
  telegramId: bigint;
};

export type CoupleContext = {
  userId: string;
  coupleId: string;
  membershipId: string;
  role: "OWNER" | "PARTNER";
};
