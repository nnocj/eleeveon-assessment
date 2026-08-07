"use client";

/**
 * app/components/role-portals/EleeveonCenter.tsx
 * --------------------------------------------------------------------------
 * Built-in portal module opened by RolePortalShell.navigate().
 *
 * This is intentionally not a standalone route. It behaves like Dashboard,
 * Students, Reports and every other portal tab while remaining shared by all
 * role portals.
 */

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  db,
  type LocalPlatformAnnouncement,
  type LocalPlatformAnnouncementReceipt,
  type PlatformFeedback,
  type PlatformFeedbackType,
} from "../../lib/db/db";

import {
  createLocal,
  updateLocal,
  type SyncableRecord,
} from "../../lib/sync/syncUtils";

import {
  useAccount,
} from "../../context/account-context";

import {
  useActiveMembership,
} from "../../context/active-membership-context";

import {
  useActiveBranch,
} from "../../context/active-branch-context";

import {
  useOptionalAccess,
} from "../../context/subscription-context";

import type {
  RolePortalRouteProps,
} from "./RolePortalShell";

type CenterSection =
  | "updates"
  | "feedback"
  | "support"
  | "access";

type AnnouncementReceiptCreateInput =
  SyncableRecord & {
    id: string;
    announcementId: string;
    userId?: string | null;
    membershipId?: string | null;
    deliveredAt?: string | null;
    readAt?: string | null;
    acknowledgedAt?: string | null;
    dismissedAt?: string | null;
  };

type FeedbackCreateInput =
  SyncableRecord & {
    id: string;
    schoolId?: string | null;
    branchId?: string | null;
    userId?: string | null;
    membershipId?: string | null;
    type: PlatformFeedbackType;
    status: "submitted";
    priority: "normal";
    subject: string;
    message: string;
    appVersion?: string | null;
    route?: string | null;
    deviceInfo?: Record<
      string,
      unknown
    > | null;
    submittedAt: number;
    metadata?: Record<
      string,
      unknown
    > | null;
  };

const feedbackTypes: Array<{
  value: PlatformFeedbackType;
  label: string;
}> = [
  {
    value: "suggestion",
    label: "Suggestion",
  },
  {
    value: "complaint",
    label: "Complaint",
  },
  {
    value: "bug",
    label: "Bug report",
  },
  {
    value: "support_request",
    label: "Support request",
  },
  {
    value: "feature_request",
    label: "Feature request",
  },
  {
    value: "billing_question",
    label: "Billing question",
  },
  {
    value: "general_feedback",
    label: "General feedback",
  },
];

function idOf(value: unknown) {
  return value == null
    ? ""
    : String(value).trim();
}

function stableId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function dateText(
  value?: string | number | null,
) {
  if (!value) return "Recently";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleString(
        "en-GH",
        {
          dateStyle: "medium",
          timeStyle: "short",
        },
      );
}

function visibleAnnouncement(
  announcement:
    LocalPlatformAnnouncement,
  role?: string | null,
) {
  if (
    announcement.status !==
    "published"
  ) {
    return false;
  }

  const now = Date.now();

  if (
    announcement.publishAt &&
    new Date(
      announcement.publishAt,
    ).getTime() > now
  ) {
    return false;
  }

  if (
    announcement.expiresAt &&
    new Date(
      announcement.expiresAt,
    ).getTime() < now
  ) {
    return false;
  }

  if (
    announcement.targetRoles?.length &&
    role &&
    !announcement.targetRoles.includes(
      role,
    )
  ) {
    return false;
  }

  return true;
}

export default function EleeveonCenter({
  navigate,
}: RolePortalRouteProps) {
  const {
    accountId,
    account,
    user,
  } = useAccount() as any;

  const {
    activeMembership,
  } = useActiveMembership();

  const {
    activeSchoolId,
    activeBranchId,
    activeSchool,
    activeBranch,
  } = useActiveBranch();

  const access =
    useOptionalAccess();

  const [section, setSection] =
    useState<CenterSection>(
      "updates",
    );

  const [
    announcements,
    setAnnouncements,
  ] = useState<
    LocalPlatformAnnouncement[]
  >([]);

  const [receipts, setReceipts] =
    useState<
      LocalPlatformAnnouncementReceipt[]
    >([]);

  const [feedback, setFeedback] =
    useState<PlatformFeedback[]>([]);

  const [feedbackType, setFeedbackType] =
    useState<PlatformFeedbackType>(
      "suggestion",
    );

  const [subject, setSubject] =
    useState("");

  const [messageBody, setMessageBody] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [notice, setNotice] =
    useState<string | null>(null);

  const userId = idOf(user?.id);

  const membershipId = idOf(
    activeMembership?.id,
  );

  const role =
    activeMembership?.role ??
    account?.role ??
    user?.role ??
    null;

  const load = async () => {
    if (!accountId) return;

    const [
      announcementRows,
      receiptRows,
      feedbackRows,
    ] = await Promise.all([
      db.platformAnnouncements.toArray(),
      db.platformAnnouncementReceipts
        .where("accountId")
        .equals(accountId)
        .toArray(),
      db.platformFeedback
        .where("accountId")
        .equals(accountId)
        .toArray(),
    ]);

    setAnnouncements(
      announcementRows
        .filter((row) =>
          visibleAnnouncement(
            row,
            role,
          ),
        )
        .sort(
          (left, right) =>
            new Date(
              right.publishAt ??
                right.createdAt ??
                0,
            ).getTime() -
            new Date(
              left.publishAt ??
                left.createdAt ??
                0,
            ).getTime(),
        ),
    );

    setReceipts(receiptRows);

    setFeedback(
      feedbackRows.sort(
        (left, right) =>
          Number(right.submittedAt) -
          Number(left.submittedAt),
      ),
    );
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, role]);

  const receiptByAnnouncement =
    useMemo(
      () =>
        new Map(
          receipts.map((receipt) => [
            receipt.announcementId,
            receipt,
          ]),
        ),
      [receipts],
    );

  const unreadCount =
    announcements.filter(
      (announcement) =>
        !receiptByAnnouncement.get(
          announcement.id,
        )?.readAt,
    ).length;

  const markRead = async (
    announcement:
      LocalPlatformAnnouncement,
  ) => {
    if (!accountId) return;

    const existing =
      receiptByAnnouncement.get(
        announcement.id,
      );

    const patch = {
      accountId,
      announcementId:
        announcement.id,
      userId: userId || null,
      membershipId:
        membershipId || null,
      deliveredAt:
        existing?.deliveredAt ??
        new Date().toISOString(),
      readAt:
        new Date().toISOString(),
      acknowledgedAt:
        existing?.acknowledgedAt ??
        null,
      dismissedAt:
        existing?.dismissedAt ??
        null,
    };

    if (existing) {
      await updateLocal(
        "platformAnnouncementReceipts",
        existing.id,
        patch,
      );
    } else {
      const input:
        AnnouncementReceiptCreateInput =
        {
          id: stableId(),
          ...patch,
        };

      await createLocal<
        AnnouncementReceiptCreateInput
      >(
        "platformAnnouncementReceipts",
        input,
      );
    }

    await load();
  };

  const submitFeedback =
    async () => {
      if (
        !accountId ||
        !subject.trim() ||
        !messageBody.trim()
      ) {
        setNotice(
          "Add a subject and message.",
        );
        return;
      }

      try {
        setSaving(true);
        setNotice(null);

        const input:
          FeedbackCreateInput = {
          id: stableId(),
          accountId,
          schoolId:
            activeSchoolId ?? null,
          branchId:
            activeBranchId ?? null,
          userId: userId || null,
          membershipId:
            membershipId || null,
          type: feedbackType,
          status: "submitted",
          priority: "normal",
          subject: subject.trim(),
          message:
            messageBody.trim(),
          appVersion:
            process.env
              .NEXT_PUBLIC_APP_VERSION ??
            null,
          route: null,
          submittedAt: Date.now(),
          deviceInfo:
            typeof navigator !==
            "undefined"
              ? {
                  userAgent:
                    navigator.userAgent,
                  language:
                    navigator.language,
                  online:
                    navigator.onLine,
                }
              : null,
          metadata: {
            role,
            schoolName:
              activeSchool?.name ??
              null,
            branchName:
              activeBranch?.name ??
              null,
          },
        };

        await createLocal<
          FeedbackCreateInput
        >(
          "platformFeedback",
          input,
        );

        setSubject("");
        setMessageBody("");
        setNotice(
          "Your message has been saved and queued for Eleeveon.",
        );

        await load();
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Could not submit your message.",
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <main className="center-module hub-module">
      <style>{css}</style>

      <section className="center-intro hub-overview">
        <div>
          <span>
            Eleeveon Hub
          </span>
          <h2>
            Messages, notices and support
          </h2>
          <p>
            Review platform messages, announcements, support requests and workspace access in one place.
          </p>
        </div>

        <div className="center-workspace">
          <strong>
            {activeSchool?.name ??
              account?.name ??
              "Eleeveon workspace"}
          </strong>
          <span>
            {activeBranch?.name ??
              role
                ?.replaceAll("_", " ") ??
              "Account"}
          </span>
        </div>
      </section>

      <nav className="center-tabs hub-tabs">
        <button
          type="button"
          className={
            section === "updates"
              ? "active"
              : ""
          }
          onClick={() =>
            setSection("updates")
          }
        >
          Updates
          {unreadCount ? (
            <b>{unreadCount}</b>
          ) : null}
        </button>

        <button
          type="button"
          className={
            section === "feedback"
              ? "active"
              : ""
          }
          onClick={() =>
            setSection("feedback")
          }
        >
          Feedback
        </button>

        <button
          type="button"
          className={
            section === "support"
              ? "active"
              : ""
          }
          onClick={() =>
            setSection("support")
          }
        >
          Support
        </button>

        <button
          type="button"
          className={
            section === "access"
              ? "active"
              : ""
          }
          onClick={() =>
            setSection("access")
          }
        >
          Access
        </button>
      </nav>

      {section === "updates" ? (
        <section className="center-list">
          {announcements.length ? (
            announcements.map(
              (announcement) => {
                const receipt =
                  receiptByAnnouncement.get(
                    announcement.id,
                  );

                return (
                  <article
                    key={
                      announcement.id
                    }
                    className="center-card"
                  >
                    <header>
                      <span>
                        {announcement.type}
                      </span>
                      <small>
                        {dateText(
                          announcement.publishAt ??
                            announcement.createdAt,
                        )}
                      </small>
                    </header>

                    <h3>
                      {
                        announcement.title
                      }
                    </h3>

                    <p>
                      {announcement.body}
                    </p>

                    <footer>
                      {receipt?.readAt ? (
                        <span className="read-state">
                          Read
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            void markRead(
                              announcement,
                            )
                          }
                        >
                          Mark as read
                        </button>
                      )}

                      {announcement.actionUrl ? (
                        <button
                          type="button"
                          className="primary"
                          onClick={() => {
                            if (
                              announcement
                                .actionUrl
                                ?.startsWith(
                                  "#",
                                )
                            ) {
                              navigate(
                                announcement.actionUrl.slice(
                                  1,
                                ),
                              );
                            }
                          }}
                        >
                          {announcement.actionLabel ??
                            "Open"}
                        </button>
                      ) : null}
                    </footer>
                  </article>
                );
              },
            )
          ) : (
            <div className="center-empty">
              No current announcements.
            </div>
          )}
        </section>
      ) : null}

      {section === "feedback" ? (
        <section className="center-grid">
          <article className="center-card">
            <span className="kicker">
              Send to Eleeveon
            </span>
            <h3>
              Share an idea or report a
              problem
            </h3>

            <label>
              Type
              <select
                value={feedbackType}
                onChange={(event) =>
                  setFeedbackType(
                    event.target
                      .value as PlatformFeedbackType,
                  )
                }
              >
                {feedbackTypes.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Subject
              <input
                value={subject}
                onChange={(event) =>
                  setSubject(
                    event.target.value,
                  )
                }
                placeholder="What is this about?"
              />
            </label>

            <label>
              Message
              <textarea
                rows={6}
                value={messageBody}
                onChange={(event) =>
                  setMessageBody(
                    event.target.value,
                  )
                }
                placeholder="Explain what happened or what you would like improved."
              />
            </label>

            {notice ? (
              <div className="notice">
                {notice}
              </div>
            ) : null}

            <button
              type="button"
              className="primary submit"
              disabled={saving}
              onClick={() =>
                void submitFeedback()
              }
            >
              {saving
                ? "Submitting…"
                : "Submit"}
            </button>
          </article>

          <article className="center-card">
            <span className="kicker">
              Your messages
            </span>
            <h3>
              Feedback history
            </h3>

            <div className="history">
              {feedback.length ? (
                feedback.map((item) => (
                  <div key={item.id}>
                    <strong>
                      {item.subject}
                    </strong>
                    <span>
                      {item.type.replaceAll(
                        "_",
                        " ",
                      )}
                      {" · "}
                      {item.status.replaceAll(
                        "_",
                        " ",
                      )}
                    </span>
                    <small>
                      {dateText(
                        item.submittedAt,
                      )}
                    </small>
                  </div>
                ))
              ) : (
                <p>
                  No feedback submitted
                  yet.
                </p>
              )}
            </div>
          </article>
        </section>
      ) : null}

      {section === "support" ? (
        <section className="center-grid">
          <article className="center-card">
            <span className="kicker">
              Help
            </span>
            <h3>
              Request workspace support
            </h3>
            <p>
              Your school, branch, role
              and device context will be
              included automatically.
            </p>
            <button
              type="button"
              className="primary"
              onClick={() => {
                setFeedbackType(
                  "support_request",
                );
                setSection("feedback");
              }}
            >
              Create support request
            </button>
          </article>

          <article className="center-card">
            <span className="kicker">
              System status
            </span>
            <h3>
              Review pending data
            </h3>
            <p>
              Tap the connection status
              in the portal header to
              inspect pending and failed
              records by table.
            </p>
          </article>
        </section>
      ) : null}

      {section === "access" ? (
        <section className="center-grid">
          <article className="center-card">
            <span className="kicker">
              Current access
            </span>
            <h3>
              {access?.snapshot
                ?.source ??
                "Workspace access"}
            </h3>

            <div className="facts">
              <div>
                <span>Status</span>
                <strong>
                  {access?.status ??
                    "Unknown"}
                </strong>
              </div>
              <div>
                <span>
                  Deployment
                </span>
                <strong>
                  {access?.deploymentMode ??
                    "Not resolved"}
                </strong>
              </div>
              <div>
                <span>
                  Sync policy
                </span>
                <strong>
                  {access?.syncPolicy ??
                    "Not resolved"}
                </strong>
              </div>
            </div>
          </article>

          <article className="center-card">
            <span className="kicker">
              Upgrade
            </span>
            <h3>
              Add capacity or features
            </h3>
            <p>
              Upgrade controls will use
              the subscription module
              available to the account
              owner. Other roles can
              send a billing question
              from Feedback.
            </p>

            <button
              type="button"
              onClick={() => {
                setFeedbackType(
                  "billing_question",
                );
                setSection("feedback");
              }}
            >
              Ask about access
            </button>
          </article>
        </section>
      ) : null}
    </main>
  );
}

const css = `
.center-module {
  width: 100%;
  min-height: 100%;
  color:
    var(--text, #111111);
}

.center-module * {
  box-sizing: border-box;
}

.center-intro {
  display: flex;
  align-items: flex-start;
  justify-content:
    space-between;
  gap: 14px;
  padding: 16px;
  border: 1px solid
    var(
      --border,
      rgba(0,0,0,.08)
    );
  border-radius: 20px;
  background:
    var(--surface, #ffffff);
}

.center-intro > div:first-child {
  min-width: 0;
}

.center-intro > div:first-child >
span,
.kicker {
  color:
    var(
      --dashboard-primary,
      var(--primary-color, #2563eb)
    );
  font-size: 10px;
  font-weight: 950;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.center-intro h2 {
  margin: 4px 0;
  font-size:
    clamp(21px, 4vw, 30px);
  letter-spacing: -.04em;
}

.center-intro p,
.center-card p {
  margin: 0;
  color:
    var(--muted, #64748b);
  line-height: 1.55;
}

.center-workspace {
  flex: 0 0 auto;
  max-width: 240px;
  padding: 9px 11px;
  border-radius: 14px;
  background:
    var(
      --shell-section-bg,
      #f7f8fb
    );
  text-align: right;
}

.center-workspace strong,
.center-workspace span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.center-workspace strong {
  font-size: 12px;
}

.center-workspace span {
  margin-top: 2px;
  color:
    var(--muted, #64748b);
  font-size: 10px;
}

.center-tabs {
  display: flex;
  gap: 6px;
  margin: 12px 0;
  overflow-x: auto;
}

.center-tabs button {
  min-height: 38px;
  white-space: nowrap;
  border: 1px solid
    var(
      --border,
      rgba(0,0,0,.08)
    );
  border-radius: 12px;
  padding: 8px 12px;
  background:
    var(--surface, #ffffff);
  color: inherit;
  font-weight: 850;
  cursor: pointer;
}

.center-tabs button.active {
  border-color:
    var(
      --dashboard-primary,
      var(--primary-color, #2563eb)
    );
  color:
    var(
      --dashboard-primary,
      var(--primary-color, #2563eb)
    );
  background:
    color-mix(
      in srgb,
      var(
        --dashboard-primary,
        var(--primary-color, #2563eb)
      ) 8%,
      var(--surface, #ffffff)
    );
}

.center-tabs b {
  margin-left: 6px;
  padding: 1px 5px;
  border-radius: 999px;
  background:
    var(
      --dashboard-primary,
      var(--primary-color, #2563eb)
    );
  color: #fff;
  font-size: 9px;
}

.center-list {
  display: grid;
  gap: 9px;
}

.center-grid {
  display: grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );
  gap: 10px;
}

.center-card,
.center-empty {
  padding: 15px;
  border: 1px solid
    var(
      --border,
      rgba(0,0,0,.08)
    );
  border-radius: 18px;
  background:
    var(--surface, #ffffff);
}

.center-card header,
.center-card footer {
  display: flex;
  align-items: center;
  justify-content:
    space-between;
  gap: 8px;
}

.center-card header > span {
  color:
    var(
      --dashboard-primary,
      var(--primary-color, #2563eb)
    );
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.center-card header small {
  color:
    var(--muted, #64748b);
}

.center-card h3 {
  margin: 7px 0;
  font-size: 18px;
}

.center-card footer {
  justify-content: flex-end;
  margin-top: 12px;
}

.center-card button {
  min-height: 38px;
  border: 1px solid
    var(
      --border,
      rgba(0,0,0,.08)
    );
  border-radius: 11px;
  padding: 8px 11px;
  background: transparent;
  color: inherit;
  font-weight: 850;
  cursor: pointer;
}

.center-card button.primary {
  border-color: transparent;
  background:
    var(
      --dashboard-primary,
      var(--primary-color, #2563eb)
    );
  color: #fff;
}

.center-card button.submit {
  width: 100%;
  margin-top: 12px;
}

.center-card label {
  display: grid;
  gap: 5px;
  margin-top: 11px;
  font-size: 12px;
  font-weight: 800;
}

.center-card input,
.center-card select,
.center-card textarea {
  width: 100%;
  border: 1px solid
    var(
      --border,
      rgba(0,0,0,.08)
    );
  border-radius: 11px;
  padding: 10px;
  background: transparent;
  color: inherit;
  font: inherit;
}

.notice {
  margin-top: 11px;
  padding: 9px;
  border-radius: 11px;
  background:
    color-mix(
      in srgb,
      var(
        --dashboard-primary,
        var(--primary-color, #2563eb)
      ) 8%,
      transparent
    );
  font-size: 12px;
}

.history {
  display: grid;
  gap: 7px;
  margin-top: 10px;
}

.history > div {
  display: grid;
  gap: 2px;
  padding: 9px;
  border-radius: 12px;
  background:
    var(
      --shell-section-bg,
      #f7f8fb
    );
}

.history span,
.history small,
.read-state {
  color:
    var(--muted, #64748b);
}

.facts {
  display: grid;
  gap: 6px;
  margin-top: 12px;
}

.facts > div {
  display: flex;
  justify-content:
    space-between;
  gap: 8px;
  padding: 9px;
  border-radius: 11px;
  background:
    var(
      --shell-section-bg,
      #f7f8fb
    );
}

.facts span {
  color:
    var(--muted, #64748b);
}

.center-empty {
  min-height: 150px;
  display: grid;
  place-items: center;
  text-align: center;
  color:
    var(--muted, #64748b);
}

@media (max-width: 720px) {
  .center-intro {
    display: grid;
  }

  .center-workspace {
    max-width: none;
    text-align: left;
  }

  .center-grid {
    grid-template-columns: 1fr;
  }
}

/* Eleeveon Hub visual hierarchy --------------------------------------- */
.hub-module {
  display: grid;
  gap: 12px;
}

.hub-overview {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(
      135deg,
      var(--eds-surface),
      color-mix(in srgb, var(--eds-primary) 6%, var(--eds-surface))
    );
  box-shadow: var(--eds-shadow-soft);
}

.hub-overview::after {
  content: "";
  position: absolute;
  right: -60px;
  top: -90px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--eds-primary) 10%, transparent);
  pointer-events: none;
}

.hub-tabs {
  position: sticky;
  top: 0;
  z-index: 4;
  padding: 6px;
  border: 1px solid var(--eds-border);
  border-radius: var(--eds-radius-card);
  background: color-mix(in srgb, var(--eds-surface) 94%, transparent);
  backdrop-filter: blur(14px);
}

.center-card {
  background: var(--eds-card) !important;
  border-color: var(--eds-border) !important;
  box-shadow: var(--eds-shadow-soft);
}

.center-card:hover {
  border-color: var(--eds-border-strong) !important;
}
`;
