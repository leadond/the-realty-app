export type ContractVars = {
  agentName: string;
  brokerageName?: string;
  buyerName: string;
  propertyAddress?: string;
  price?: string;
  commissionRate?: string;
  termMonths?: string;
  date: string;
};

const TEMPLATES: Record<string, (v: ContractVars) => string> = {
  BUYER_REPRESENTATION: (v) => `BUYER REPRESENTATION AGREEMENT

Date: ${v.date}

This agreement is entered into between ${v.agentName}${v.brokerageName ? ` of ${v.brokerageName}` : ""} ("Agent") and ${v.buyerName} ("Buyer").

1. SCOPE OF REPRESENTATION
Agent agrees to represent Buyer's interests in the search for and purchase of real property, acting with diligence and good faith.

2. DURATION
This agreement is effective from the date above for a period of ${v.termMonths || "6"} months, unless terminated earlier in writing by either party.

3. BUYER'S OBLIGATIONS
Buyer agrees to work exclusively with Agent during the term of this agreement, provide accurate financial information, and negotiate in good faith.

4. AGENT'S OBLIGATIONS
Agent agrees to provide professional real estate services, disclose all material facts, and maintain confidentiality of Buyer's information.

5. COMPENSATION
Agent's commission is ${v.commissionRate || "3"}% of the final purchase price, payable at closing, customarily paid by the seller unless otherwise negotiated.

By signing below, both parties agree to the terms of this agreement.`,

  SELLER_REPRESENTATION: (v) => `EXCLUSIVE LISTING AGREEMENT

Date: ${v.date}

This agreement is entered into between ${v.agentName}${v.brokerageName ? ` of ${v.brokerageName}` : ""} ("Agent") and ${v.buyerName} ("Seller") for the property at ${v.propertyAddress || "[Property Address]"}.

1. LISTING
Seller grants Agent the exclusive right to market and sell the property for a listing price of ${v.price || "[Price]"}.

2. TERM
This agreement is effective for ${v.termMonths || "6"} months from the date above.

3. AGENT'S OBLIGATIONS
Agent agrees to market the property, present all offers promptly, and act in Seller's best interest.

4. SELLER'S OBLIGATIONS
Seller agrees to make the property available for showings, disclose known material defects, and cooperate in good faith with the sale process.

5. COMMISSION
Seller agrees to pay Agent a commission of ${v.commissionRate || "6"}% of the final sale price, payable at closing.

By signing below, both parties agree to the terms of this agreement.`,

  COMMISSION_AGREEMENT: (v) => `COMMISSION AGREEMENT

Date: ${v.date}

Between ${v.agentName}${v.brokerageName ? ` of ${v.brokerageName}` : ""} ("Agent") and ${v.buyerName} ("Client").

Client agrees to compensate Agent a commission of ${v.commissionRate || "3"}% on the transaction ${v.propertyAddress ? `for ${v.propertyAddress}` : ""}${v.price ? ` at a price of ${v.price}` : ""}, payable upon successful closing.

By signing below, both parties agree to the terms of this agreement.`,

  DUAL_AGENCY: (v) => `DUAL AGENCY DISCLOSURE AND CONSENT

Date: ${v.date}

${v.agentName}${v.brokerageName ? ` of ${v.brokerageName}` : ""} is acting as a dual agent representing both the buyer and seller in the transaction${v.propertyAddress ? ` for ${v.propertyAddress}` : ""}.

${v.buyerName} acknowledges understanding that a dual agent owes limited fiduciary duties to both parties and cannot fully advocate for either side's interests exclusively, and consents to this dual representation.

By signing below, all parties acknowledge and consent to this dual agency arrangement.`,

  INSPECTION_WAIVER: (v) => `INSPECTION CONTINGENCY WAIVER

Date: ${v.date}

${v.buyerName} acknowledges being advised by ${v.agentName} of the right to a professional home inspection${v.propertyAddress ? ` on the property at ${v.propertyAddress}` : ""}, and voluntarily elects to waive this contingency.

Buyer understands this waiver may limit their ability to renegotiate or withdraw from the transaction based on property condition discovered after closing.

By signing below, Buyer confirms this waiver is made knowingly and voluntarily.`,

  CONTINGENCY_REMOVAL: (v) => `CONTINGENCY REMOVAL NOTICE

Date: ${v.date}

${v.buyerName} hereby removes the following contingencies on the purchase agreement${v.propertyAddress ? ` for ${v.propertyAddress}` : ""}, as facilitated by ${v.agentName}.

This removal is effective as of the date above and is a binding modification to the purchase agreement.

By signing below, Buyer confirms this removal is made knowingly and voluntarily.`,

  EARNEST_MONEY: (v) => `EARNEST MONEY RECEIPT AND AGREEMENT

Date: ${v.date}

Received from ${v.buyerName}, earnest money deposit in connection with the purchase of ${v.propertyAddress || "[Property Address]"}${v.price ? ` at a purchase price of ${v.price}` : ""}, to be held in escrow pending closing, as facilitated by ${v.agentName}${v.brokerageName ? ` of ${v.brokerageName}` : ""}.

By signing below, all parties acknowledge the terms of this earnest money agreement.`,

  CUSTOM: (v) => `AGREEMENT

Date: ${v.date}

Between ${v.agentName}${v.brokerageName ? ` of ${v.brokerageName}` : ""} and ${v.buyerName}.

[Custom terms — edit before sending]

By signing below, both parties agree to the terms of this agreement.`,
};

export function renderContractTemplate(type: string, vars: ContractVars): string {
  const template = TEMPLATES[type] || TEMPLATES.CUSTOM;
  return template(vars);
}

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  BUYER_REPRESENTATION: "Buyer Representation Agreement",
  SELLER_REPRESENTATION: "Seller Listing Agreement",
  DUAL_AGENCY: "Dual Agency Disclosure",
  COMMISSION_AGREEMENT: "Commission Agreement",
  INSPECTION_WAIVER: "Inspection Waiver",
  CONTINGENCY_REMOVAL: "Contingency Removal",
  EARNEST_MONEY: "Earnest Money Receipt",
  CUSTOM: "Custom Agreement",
};
