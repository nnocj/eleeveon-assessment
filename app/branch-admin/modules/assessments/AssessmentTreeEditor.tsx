"use client";

import {
  useMemo,
  useState,
} from "react";
import type {
  AssessmentTreeBuildResult,
  AssessmentTreeNode,
  AssessmentValidationIssue,
} from "../../../lib/assessments";
import {
  AssessmentTreeNodeCard,
} from "./AssessmentTreeNodeCard";

export function AssessmentTreeEditor({
  tree,
  issues,
  onEdit,
  onAddChild,
  onMoveBefore,
  onMoveAfter,
  onIndent,
  onOutdent,
  onDelete,
}: {
  tree: AssessmentTreeBuildResult;
  issues: AssessmentValidationIssue[];
  onEdit(node: AssessmentTreeNode): void;
  onAddChild(node: AssessmentTreeNode): void;
  onMoveBefore(
    itemId: string,
    targetId: string,
  ): void | Promise<void>;
  onMoveAfter(
    itemId: string,
    targetId: string,
  ): void | Promise<void>;
  onIndent(
    itemId: string,
  ): void | Promise<void>;
  onOutdent(
    itemId: string,
  ): void | Promise<void>;
  onDelete(
    itemId: string,
  ): void | Promise<void>;
}) {
  const initialExpanded = useMemo(
    () =>
      new Set(
        tree.nodes
          .filter(
            (node) =>
              node.children.length > 0,
          )
          .map((node) =>
            String(node.item.id),
          ),
      ),
    [tree],
  );

  const [expanded, setExpanded] =
    useState<Set<string>>(
      initialExpanded,
    );

  const toggle = (itemId: string) => {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }

      return next;
    });
  };

  if (!tree.roots.length) {
    return (
      <div className="ae-empty">
        <strong>
          No assessment items
        </strong>
        <p>
          Create a root item such as
          Class Score or Examination.
        </p>
      </div>
    );
  }

  return (
    <div className="ae-tree-editor">
      {tree.roots.map((node) => (
        <Node
          key={String(node.item.id)}
          node={node}
          siblings={tree.roots}
          issues={issues}
          expanded={expanded}
          toggle={toggle}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onMoveBefore={onMoveBefore}
          onMoveAfter={onMoveAfter}
          onIndent={onIndent}
          onOutdent={onOutdent}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function Node({
  node,
  siblings,
  issues,
  expanded,
  toggle,
  onEdit,
  onAddChild,
  onMoveBefore,
  onMoveAfter,
  onIndent,
  onOutdent,
  onDelete,
}: {
  node: AssessmentTreeNode;
  siblings: AssessmentTreeNode[];
  issues: AssessmentValidationIssue[];
  expanded: Set<string>;
  toggle(itemId: string): void;
  onEdit(node: AssessmentTreeNode): void;
  onAddChild(node: AssessmentTreeNode): void;
  onMoveBefore(
    itemId: string,
    targetId: string,
  ): void | Promise<void>;
  onMoveAfter(
    itemId: string,
    targetId: string,
  ): void | Promise<void>;
  onIndent(
    itemId: string,
  ): void | Promise<void>;
  onOutdent(
    itemId: string,
  ): void | Promise<void>;
  onDelete(
    itemId: string,
  ): void | Promise<void>;
}) {
  const id = String(node.item.id);
  const index = siblings.findIndex(
    (item) =>
      String(item.item.id) === id,
  );
  const previous = siblings[index - 1];
  const next = siblings[index + 1];
  const isExpanded = expanded.has(id);

  return (
    <>
      <AssessmentTreeNodeCard
        node={node}
        issues={issues}
        expanded={isExpanded}
        onToggle={() => toggle(id)}
        onEdit={() => onEdit(node)}
        onAddChild={() =>
          onAddChild(node)
        }
        onMoveUp={() => {
          if (previous) {
            void onMoveBefore(
              id,
              String(previous.item.id),
            );
          }
        }}
        onMoveDown={() => {
          if (next) {
            void onMoveAfter(
              id,
              String(next.item.id),
            );
          }
        }}
        onIndent={() =>
          void onIndent(id)
        }
        onOutdent={() =>
          void onOutdent(id)
        }
        onDelete={() =>
          void onDelete(id)
        }
      />

      {isExpanded
        ? node.children.map((child) => (
            <Node
              key={String(
                child.item.id,
              )}
              node={child}
              siblings={node.children}
              issues={issues}
              expanded={expanded}
              toggle={toggle}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onMoveBefore={
                onMoveBefore
              }
              onMoveAfter={onMoveAfter}
              onIndent={onIndent}
              onOutdent={onOutdent}
              onDelete={onDelete}
            />
          ))
        : null}
    </>
  );
}