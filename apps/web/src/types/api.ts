/* ============================================================
   API TYPES — mirrors backend response envelopes
   ============================================================ */

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/* ---------- Auth ---------- */
export type AuthMeResponse = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  language?: "UZ" | "RU" | "EN";
  languageCode?: string | null;
  status?: string;
  createdAt?: string;
};

/* ---------- Couple ---------- */
export type CoupleMemberView = {
  id: string;
  telegramId?: string;
  firstName: string | null;
  lastName?: string | null;
  username: string | null;
  photoUrl: string | null;
  role: string;
};

export type CoupleView = {
  couple: {
    id: string;
    status: string;
    displayName: string | null;
    anniversaryDate: string | null;
    timezone: string;
    createdAt: string;
  };
  me: CoupleMemberView;
  partner: CoupleMemberView | null;
};

export type CoupleData = CoupleView | null;

/* ---------- Invite ---------- */
export type InviteCreateResponse = {
  code: string;
  expiresAt: string;
  status: string;
  shareUrl: string | null;
};

export type InvitePreviewResponse = {
  code: string;
  status: string;
  expiresAt: string;
  couple: {
    id: string;
    displayName: string | null;
  };
  sender: {
    firstName: string | null;
    username: string | null;
    photoUrl: string | null;
  };
};

/* ---------- Home ---------- */
export type HomeUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
};

export type HomePartner = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
};

export type ActivityType =
  | "MEMORY_ADDED"
  | "MEMORY_REACTED"
  | "LETTER_SENT"
  | "BOOK_ADDED"
  | "READING_PROGRESS"
  | "CHALLENGE_CREATED"
  | "CHALLENGE_COMPLETED"
  | "DATE_CREATED"
  | "PARTNER_JOINED"
  | "PARTNER_LEFT";

export type ActivityEvent = {
  id: string;
  type: ActivityType;
  entityId: string | null;
  payload: unknown;
  createdAt: string;
  actor: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  } | null;
};

export type HomeStats = {
  memories: number;
  letters: number;
  dates: number;
  books: number;
  challenges: number;
};

export type HomeReading = {
  id: string;
  title: string;
  author: string | null;
  pageCount: number | null;
  progress: Array<{
    userId: string;
    currentPage: number;
    percent: number;
  }>;
};

export type HomeUpcomingDate = {
  id: string;
  title: string;
  startsAt: string;
  location: string | null;
};

export type HomeData = {
  user: HomeUser;
  couple: {
    id: string;
    displayName: string | null;
    anniversaryDate: string | null;
    timezone: string;
    createdAt: string;
    togetherDays: number;
  };
  partner: HomePartner | null;
  recentActivity: ActivityEvent[];
  stats: HomeStats;
  reading: HomeReading | null;
  upcomingDates: HomeUpcomingDate[];
};

/* ---------- Activity ---------- */
export type ActivityPage = {
  items: ActivityEvent[];
  nextCursor: string | null;
};

/* ---------- Memories ---------- */
export type MemoryType = "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT" | "TEXT";
export type MemoryVisibility = "COUPLE" | "PRIVATE";

export type MemoryMediaFile = {
  id: string;
  fileType: string;
  mimeType: string | null;
  fileName: string | null;
  width: number | null;
  height: number | null;
};

export type MemoryMedia = {
  id: string;
  storage: string;
  externalUrl: string | null;
  telegramFile: MemoryMediaFile | null;
};

export type MemoryReaction = {
  id: string;
  emoji: string;
  userId: string;
  createdAt: string;
};

export type MemoryItem = {
  id: string;
  type: MemoryType;
  visibility: MemoryVisibility;
  title: string | null;
  caption: string | null;
  eventAt: string | null;
  locationName: string | null;
  privateOwnerId: string | null;
  createdAt: string;
  updatedAt?: string;
  author: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  };
  media: MemoryMedia[];
  reactions: MemoryReaction[];
  _count?: {
    media: number;
    reactions: number;
  };
};

export type MemoryPage = {
  items: MemoryItem[];
  nextCursor: string | null;
};

/* ---------- Letters ---------- */
export type LetterStatus = "DRAFT" | "SENT" | "READ" | "ARCHIVED";

export type LetterItem = {
  id: string;
  title: string | null;
  body: string;
  status: LetterStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt?: string;
  senderId: string;
  receiverId: string;
  sender: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  };
  receiver: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  };
};

/* ---------- Dates ---------- */
export type DateItem = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  reminderAt: string | null;
  createdAt: string;
  updatedAt?: string;
  creatorId: string;
  creator: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  };
};

/* ---------- Reading ---------- */
export type BookStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type ReadingProgressItem = {
  userId: string;
  currentPage: number;
  pagesRead: number;
  percent: number;
  lastReadAt: string;
  streakDays: number;
  totalReadSeconds: number;
};

export type ReadingParticipantItem = {
  userId: string;
  status: string;
  joinedAt: string;
  completedAt?: string | null;
  user: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  };
};

export type BookItem = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  pageCount: number | null;
  status: BookStatus;
  externalUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  addedById: string;
  addedBy: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  };
  participants: ReadingParticipantItem[];
  progress: ReadingProgressItem[];
  _count?: { challenges: number };
};

/* ---------- Challenges ---------- */
export type ChallengeStatus =
  | "DRAFT"
  | "PENDING"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type ChallengeType = "READING_RACE" | "STREAK" | "PAGES" | "CUSTOM";

export type ChallengeParticipantItem = {
  userId: string;
  score: number;
  progress: number;
  joinedAt: string;
  completedAt: string | null;
  user: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  };
};

export type ChallengeItem = {
  id: string;
  title: string;
  description: string | null;
  type: ChallengeType;
  status: ChallengeStatus;
  targetValue: number | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt?: string;
  creatorId: string;
  winnerUserId: string | null;
  bookId?: string | null;
  rules?: unknown;
  creator: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  };
  winner: {
    id: string;
    firstName: string | null;
    photoUrl: string | null;
  } | null;
  book?: {
    id: string;
    title: string;
    author: string | null;
  } | null;
  participants: ChallengeParticipantItem[];
};

/* ---------- API Error ---------- */
export class ApiError extends Error {
  code: string;
  status: number;
  requestId?: string;
  details?: unknown;

  constructor(
    message: string,
    code: string,
    status: number,
    requestId?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}