CREATE TYPE "FeatureRequestStatus" AS ENUM ('PENDING', 'REVIEWED', 'PLANNED', 'SHIPPED');
CREATE TYPE "FeatureRequestPriority" AS ENUM ('INTERESTED', 'IMPORTANT', 'URGENT');

CREATE TABLE "feature_access_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "featureKey" TEXT NOT NULL,
    "featureLabel" TEXT NOT NULL,
    "requesterRole" "UserRole",
    "status" "FeatureRequestStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "FeatureRequestPriority" NOT NULL DEFAULT 'INTERESTED',
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_access_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "feature_access_requests_userId_featureKey_key" ON "feature_access_requests"("userId", "featureKey");
CREATE INDEX "feature_access_requests_featureKey_status_idx" ON "feature_access_requests"("featureKey", "status");
CREATE INDEX "feature_access_requests_featureKey_priority_idx" ON "feature_access_requests"("featureKey", "priority");
CREATE INDEX "feature_access_requests_organizationId_idx" ON "feature_access_requests"("organizationId");

ALTER TABLE "feature_access_requests" ADD CONSTRAINT "feature_access_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_access_requests" ADD CONSTRAINT "feature_access_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
