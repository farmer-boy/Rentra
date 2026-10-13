export const trustScoreConfig = {
  baseScore: 50,
  minScore: 0,
  maxScore: 100,
  weights: {
    phoneVerification: 5,
    emailVerification: 5,
    identityVerification: 10,
    completedRental: 5,
    successfulPayment: 2,
    reviewContribution: 15,
  },
  caps: {
    completedRentals: 25,
    successfulPayments: 15,
    reviewContribution: 15,
    cancellationPenalty: 15,
    confirmedReportPenalty: 25,
  },
  penalties: {
    userInitiatedCancellation: 3,
    repeatedCancellation: 2,
    confirmedReport: 10,
  },
} as const;

export const clampTrustScore = (value: number) =>
  Math.min(
    trustScoreConfig.maxScore,
    Math.max(trustScoreConfig.minScore, value),
  );
