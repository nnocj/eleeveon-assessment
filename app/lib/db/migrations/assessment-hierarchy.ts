/**
 * app/lib/db/migrations/assessment-hierarchy.ts
 * --------------------------------------------------------------------------
 * Platform V2 assessment hierarchy normalization for Dexie version 3.
 */

import type {
  Transaction,
} from "dexie";

import type {
  DataRepairLog,
  LocalMigrationJournal,
} from "../db-migrations";

import {
  getDeviceId,
  SYNC_STATUS_VALUE,
} from "../../sync/syncConfig";

export const ASSESSMENT_HIERARCHY_MIGRATION_NAME =
  "v3-assessment-hierarchy-foundation";

const TARGET_VERSION = 3;

function now() {
  return Date.now();
}

function hasTable(
  tx: Transaction,
  name: string,
) {
  return tx.db.tables.some(
    (table) => table.name === name,
  );
}

function text(value: unknown) {
  return (
    typeof value === "string" &&
    value.trim()
  )
    ? value.trim()
    : undefined;
}

function finiteNumber(
  value: unknown,
  fallback: number,
) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : fallback;
}

async function logRepair(
  tx: Transaction,
  repair: Omit<
    DataRepairLog,
    "id"
  >,
) {
  if (
    hasTable(
      tx,
      "dataRepairLogs",
    )
  ) {
    await tx
      .table("dataRepairLogs")
      .add(repair);
  }
}

export async function migrateAssessmentHierarchy(
  tx: Transaction,
): Promise<void> {
  if (
    !hasTable(
      tx,
      "assessmentStructureItems",
    )
  ) {
    return;
  }

  const startedAt = now();
  let journalId:
    | number
    | undefined;
  let affectedRecords = 0;

  if (
    hasTable(
      tx,
      "migrationJournal",
    )
  ) {
    const completed = await tx
      .table("migrationJournal")
      .where("[version+name]")
      .equals([
        TARGET_VERSION,
        ASSESSMENT_HIERARCHY_MIGRATION_NAME,
      ])
      .and(
        (
          row:
            LocalMigrationJournal,
        ) =>
          row.status ===
          "completed",
      )
      .first();

    if (completed) {
      return;
    }

    journalId = await tx
      .table("migrationJournal")
      .add({
        version:
          TARGET_VERSION,
        name:
          ASSESSMENT_HIERARCHY_MIGRATION_NAME,
        description:
          "Initializes hierarchy, calculation and report defaults on existing flat assessment items.",
        category: "data",
        startedAt,
        status: "running",
        affectedTables: [
          "assessmentStructureItems",
        ],
        affectedRecords: 0,
        rollbackSupported: false,
      } satisfies LocalMigrationJournal);
  }

  await tx
    .table(
      "assessmentStructureItems",
    )
    .toCollection()
    .modify(
      async (
        record:
          Record<
            string,
            unknown
          >,
      ) => {
        const itemId =
          text(record.id);
        const structureId =
          text(
            record
              .assessmentStructureId,
          );

        if (
          !itemId ||
          !structureId
        ) {
          return;
        }

        const patch:
          Record<
            string,
            unknown
          > = {};

        if (
          record.parentItemId ===
          undefined
        ) {
          patch.parentItemId =
            null;
        }

        if (
          typeof record.level !==
            "number" ||
          record.level < 0
        ) {
          patch.level = 0;
        }

        if (!text(record.path)) {
          patch.path =
            `${structureId}/${itemId}`;
        }

        if (
          !text(record.itemType)
        ) {
          patch.itemType =
            "scored_item";
        }

        if (
          !text(
            record
              .aggregationMode,
          )
        ) {
          patch.aggregationMode =
            "sum";
        }

        if (
          !text(
            record
              .reportVisibility,
          )
        ) {
          patch.reportVisibility =
            "show";
        }

        if (
          !text(record.entryMode)
        ) {
          patch.entryMode =
            "direct";
        }

        if (
          typeof record
            .allowChildEntry !==
          "boolean"
        ) {
          patch.allowChildEntry =
            false;
        }

        if (
          typeof record
            .showChildrenOnReport !==
          "boolean"
        ) {
          patch.showChildrenOnReport =
            false;
        }

        if (
          typeof record
            .showParentOnReport !==
          "boolean"
        ) {
          patch.showParentOnReport =
            true;
        }

        if (
          typeof record
            .normalizeChildrenToParentWeight !==
          "boolean"
        ) {
          patch.normalizeChildrenToParentWeight =
            true;
        }

        if (
          typeof record
            .allowManualOverride !==
          "boolean"
        ) {
          patch.allowManualOverride =
            false;
        }

        if (
          typeof record
            .calculationPrecision !==
          "number"
        ) {
          patch.calculationPrecision =
            2;
        }

        if (
          record
            .minimumRequiredChildren ===
          undefined
        ) {
          patch.minimumRequiredChildren =
            null;
        }

        if (
          typeof record
            .contributionWeight !==
          "number"
        ) {
          patch.contributionWeight =
            finiteNumber(
              record.weight,
              0,
            );
        }

        if (
          !Object.keys(patch)
            .length
        ) {
          return;
        }

        const deviceId =
          getDeviceId();

        patch.updatedAt =
          now();
        patch.version =
          Math.max(
            1,
            Number(
              record.version ||
                0,
            ) + 1,
          );
        patch.deviceId =
          text(
            record.deviceId,
          ) || deviceId;
        patch.createdByDeviceId =
          text(
            record
              .createdByDeviceId,
          ) || deviceId;
        patch.updatedByDeviceId =
          deviceId;
        patch.synced =
          SYNC_STATUS_VALUE.PENDING;
        patch.syncError =
          undefined;

        Object.assign(
          record,
          patch,
        );

        affectedRecords += 1;

        await logRepair(
          tx,
          {
            migrationVersion:
              TARGET_VERSION,
            migrationName:
              ASSESSMENT_HIERARCHY_MIGRATION_NAME,
            tableName:
              "assessmentStructureItems",
            entityId: itemId,
            repairType:
              "initialize-assessment-hierarchy-root",
            status: "applied",
            repairedAt: now(),
            repairedBy:
              "migration",
            newValue: patch,
          },
        );
      },
    );

  if (
    journalId !== undefined &&
    hasTable(
      tx,
      "migrationJournal",
    )
  ) {
    const completedAt =
      now();

    await tx
      .table(
        "migrationJournal",
      )
      .update(
        journalId,
        {
          status: "completed",
          completedAt,
          durationMs:
            completedAt -
            startedAt,
          affectedRecords,
        },
      );
  }
}
