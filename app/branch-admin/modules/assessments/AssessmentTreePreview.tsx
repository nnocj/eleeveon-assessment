"use client";

import type {
  AssessmentTreeNode,
} from "../../../lib/assessments";

export function AssessmentTreePreview({
  roots,
}: {
  roots: AssessmentTreeNode[];
}) {
  if (!roots.length) {
    return (
      <div className="ae-empty">
        No assessment items yet.
      </div>
    );
  }

  return (
    <div className="ae-preview">
      {roots.map((node) => (
        <PreviewNode
          key={String(node.item.id)}
          node={node}
        />
      ))}
    </div>
  );
}

function PreviewNode({
  node,
}: {
  node: AssessmentTreeNode;
}) {
  return (
    <div className="ae-preview-node">
      <div
        className="ae-preview-row"
        style={{
          paddingInlineStart:
            node.depth * 18,
        }}
      >
        <span>
          {node.children.length
            ? "▾"
            : "•"}
        </span>
        <strong>{node.item.name}</strong>
        <small>
          {Number(
            node.item.contributionWeight ??
              node.item.weight ??
              0,
          )}
          %
        </small>
      </div>

      {node.children.map((child) => (
        <PreviewNode
          key={String(child.item.id)}
          node={child}
        />
      ))}
    </div>
  );
}
