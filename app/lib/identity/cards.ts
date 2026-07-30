import {
  db,
  type StudentIdentityCard,
} from "../db/db";
import type { IdentityMutationContext } from "./types";
import { appendCredentialEvent } from "./credential-events";
import { newSyncRecord, touchSyncRecord } from "./exports";

export interface IssueStudentIdentityCardInput {
  studentId: string;
  credentialId: string;
  cardNumber: string;
  templateId?: string | null;
  expiresAt?: number | null;
  replacementOfCardId?: string | null;
}

export async function issueStudentIdentityCard(
  context: IdentityMutationContext,
  input: IssueStudentIdentityCardInput,
): Promise<StudentIdentityCard> {
  const credential = await db.identityCredentials.get(input.credentialId);

  if (
    !credential ||
    credential.subjectType !== "student" ||
    credential.subjectId !== input.studentId
  ) {
    throw new Error("The credential does not belong to the selected student.");
  }

  const duplicate = await db.studentIdentityCards
    .where("cardNumber")
    .equals(input.cardNumber.trim())
    .first();

  if (duplicate && !duplicate.isDeleted) {
    throw new Error("Card number is already in use.");
  }

  const now = context.now ?? Date.now();
  const card: StudentIdentityCard = {
    ...newSyncRecord({ ...context, now }),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    studentId: input.studentId,
    credentialId: input.credentialId,
    cardNumber: input.cardNumber.trim(),
    templateId: input.templateId ?? null,
    issuedAt: now,
    issuedByUserId: context.userId ?? null,
    expiresAt: input.expiresAt ?? credential.expiresAt ?? null,
    printCount: 0,
    replacementOfCardId: input.replacementOfCardId ?? null,
    status: "issued",
    active: true,
  };

  await db.transaction(
    "rw",
    db.studentIdentityCards,
    db.identityCredentialEvents,
    async () => {
      await db.studentIdentityCards.add(card);
      await appendCredentialEvent(context, {
        credentialId: credential.id,
        subjectType: credential.subjectType,
        subjectId: credential.subjectId,
        eventType: "issued",
        occurredAt: now,
      });
    },
  );

  return card;
}

export async function markStudentIdentityCardPrinted(
  context: IdentityMutationContext,
  cardId: string,
): Promise<void> {
  const card = await db.studentIdentityCards.get(cardId);
  if (!card) throw new Error("Student identity card was not found.");

  const now = context.now ?? Date.now();
  await db.transaction(
    "rw",
    db.studentIdentityCards,
    db.identityCredentialEvents,
    async () => {
      await db.studentIdentityCards.update(cardId, {
        printedAt: now,
        printCount: (card.printCount ?? 0) + 1,
        status: "printed",
        ...touchSyncRecord(card, { ...context, now }),
      });

      const credential = await db.identityCredentials.get(card.credentialId);
      if (credential) {
        await appendCredentialEvent(context, {
          credentialId: credential.id,
          subjectType: credential.subjectType,
          subjectId: credential.subjectId,
          eventType: "printed",
          occurredAt: now,
        });
      }
    },
  );
}
