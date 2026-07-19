-- CreateIndex
CREATE INDEX "leads_userId_idx" ON "leads"("userId");

-- CreateIndex
CREATE INDEX "open_houses_userId_idx" ON "open_houses"("userId");

-- CreateIndex
CREATE INDEX "open_houses_propertyId_idx" ON "open_houses"("propertyId");

-- CreateIndex
CREATE INDEX "properties_userId_idx" ON "properties"("userId");

-- CreateIndex
CREATE INDEX "showings_userId_idx" ON "showings"("userId");

-- CreateIndex
CREATE INDEX "showings_propertyId_idx" ON "showings"("propertyId");

-- CreateIndex
CREATE INDEX "showings_leadId_idx" ON "showings"("leadId");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_organizationId_idx" ON "transactions"("organizationId");

