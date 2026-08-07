"use client";

import {
  useState,
} from "react";
import type {
  AssessmentTreeNode,
  AssessmentValidationIssue,
} from "../../../lib/assessments";


function displayedWeight(
  node: AssessmentTreeNode,
) {
  const item = node.item;

  // Root items contribute directly to the
  // assessment system total, so their
  // visible percentage is always `weight`.
  if (!item.parentItemId) {
    return Number(item.weight ?? 0);
  }

  // Child items may use a distinct
  // contribution value when configured
  // for weighted aggregation.
  if (
    item.aggregationMode ===
      "weighted_sum" &&
    Number.isFinite(
      Number(
        item.contributionWeight,
      ),
    )
  ) {
    return Number(
      item.contributionWeight,
    );
  }

  return Number(item.weight ?? 0);
}

export function AssessmentTreeNodeCard({
  node,
  issues,
  expanded,
  onToggle,
  onEdit,
  onAddChild,
  onMoveUp,
  onMoveDown,
  onIndent,
  onOutdent,
  onDelete,
}: {
  node: AssessmentTreeNode;
  issues: AssessmentValidationIssue[];
  expanded: boolean;
  onToggle(): void;
  onEdit(): void;
  onAddChild(): void;
  onMoveUp(): void;
  onMoveDown(): void;
  onIndent(): void;
  onOutdent(): void;
  onDelete(): void;
}) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const itemIssues = issues.filter(
    (issue) =>
      issue.itemId ===
      String(node.item.id),
  );

  return (
    <article
      className="ae-node-card"
      style={{
        marginInlineStart:
          node.depth * 16,
      }}
    >
      <div className="ae-node-main">
        <button
          type="button"
          className="ae-node-toggle"
          onClick={onToggle}
          disabled={
            node.children.length === 0
          }
          aria-label={
            expanded
              ? "Collapse item"
              : "Expand item"
          }
        >
          {node.children.length
            ? expanded
              ? "▾"
              : "▸"
            : "•"}
        </button>

        <button
          type="button"
          className="ae-node-content"
          onClick={onEdit}
        >
          <span className="ae-node-title">
            {node.item.name}
          </span>

          <span className="ae-node-meta">
            {node.item.itemType ??
              (node.children.length
                ? "group"
                : "scored_item")}
            {" · "}
            {displayedWeight(node)}
            %
            {" · "}
            Max {Number(
              node.item.maxScore ?? 0,
            )}
          </span>
        </button>

        {itemIssues.length ? (
          <span
            className={
              itemIssues.some(
                (issue) =>
                  issue.severity ===
                  "error",
              )
                ? "ae-node-issue error"
                : "ae-node-issue warning"
            }
            title={itemIssues
              .map(
                (issue) =>
                  issue.message,
              )
              .join("\n")}
          >
            {itemIssues.length}
          </span>
        ) : null}

        <button
          type="button"
          className="ae-icon-button"
          onClick={() =>
            setMenuOpen((value) => !value)
          }
          aria-label="Assessment item actions"
        >
          ⋯
        </button>
      </div>

      {menuOpen ? (
        <div className="ae-node-menu">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onAddChild();
            }}
          >
            Add child
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onMoveUp();
            }}
          >
            Move up
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onMoveDown();
            }}
          >
            Move down
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onIndent();
            }}
          >
            Indent
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onOutdent();
            }}
          >
            Outdent
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onEdit();
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
          >
            Delete subtree
          </button>
        </div>
      ) : null}
    </article>
  );
}
