"use client";

/**
 * app/lib/websites/components/WebsitePreview.tsx
 * --------------------------------------------------------------------------
 * Exact website preview.
 *
 * This component never renders a simplified template. It builds the same
 * normalized WebsiteDataset used by the public website and mounts the same
 * WebsiteRenderer. The preview frame only scales that real output.
 */

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  WebsiteDataset,
  WebsiteSettingsDraft,
  WebsiteTemplateSettings,
} from "../types";

import WebsiteRenderer from "../WebsiteRenderer";

import {
  buildLocalWebsiteDataset,
  type BuildLocalWebsiteDatasetArgs,
} from "../data/buildLocalWebsiteDataset";

export type WebsitePreviewViewport =
  | "desktop"
  | "tablet"
  | "mobile";

export type WebsitePreviewProps =
  BuildLocalWebsiteDatasetArgs & {
    settings: WebsiteTemplateSettings;
    draft?: Partial<WebsiteSettingsDraft>;
    dataset?: WebsiteDataset;
    className?: string;
    viewport?: WebsitePreviewViewport;
    onDatasetResolved?: (
      dataset: WebsiteDataset,
    ) => void;
  };

const VIEWPORT_WIDTHS: Record<
  WebsitePreviewViewport,
  number
> = {
  desktop: 1440,
  tablet: 900,
  mobile: 390,
};

export default function WebsitePreview({
  accountId,
  schoolId,
  branchId,
  websiteSettingId,
  settings,
  draft,
  dataset: suppliedDataset,
  className,
  viewport = "desktop",
  onDatasetResolved,
}: WebsitePreviewProps) {
  const [dataset, setDataset] =
    useState<WebsiteDataset | null>(
      suppliedDataset || null,
    );

  const [loading, setLoading] =
    useState(!suppliedDataset);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (suppliedDataset) {
      setDataset(suppliedDataset);
      setLoading(false);
      setError(null);
      onDatasetResolved?.(
        suppliedDataset,
      );
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    buildLocalWebsiteDataset({
      accountId,
      schoolId,
      branchId,
      websiteSettingId,
      draft,
    })
      .then((resolved) => {
        if (cancelled) return;

        setDataset(resolved);
        setLoading(false);
        onDatasetResolved?.(resolved);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to build website preview.",
        );

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    accountId,
    schoolId,
    branchId,
    websiteSettingId,
    draft,
    suppliedDataset,
    onDatasetResolved,
  ]);

  const previewWidth =
    VIEWPORT_WIDTHS[viewport];

  const frameStyle = useMemo(
    () =>
      ({
        "--website-preview-width":
          `${previewWidth}px`,
      }) as React.CSSProperties,
    [previewWidth],
  );

  if (loading) {
    return (
      <div
        className={[
          "website-preview-state",
          className || "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="status"
      >
        Building website preview…
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div
        className={[
          "website-preview-state",
          "is-error",
          className || "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="alert"
      >
        {error ||
          "Website preview is unavailable."}
      </div>
    );
  }

  return (
    <div
      className={[
        "website-preview-shell",
        `website-preview-${viewport}`,
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={frameStyle}
    >
      <div className="website-preview-scroll">
        <div className="website-preview-stage">
          <div className="website-preview-document">
            <WebsiteRenderer
              dataset={dataset}
              settings={settings}
              previewMode
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .website-preview-shell {
          width: 100%;
          min-width: 0;
          overflow: hidden;
          border: 1px solid
            color-mix(
              in srgb,
              currentColor 14%,
              transparent
            );
          border-radius: 16px;
          background: #eef1f5;
        }

        .website-preview-scroll {
          width: 100%;
          overflow: auto;
          overscroll-behavior: contain;
        }

        .website-preview-stage {
          position: relative;
          width: var(
            --website-preview-width
          );
          min-height: 720px;
          transform-origin: top left;
          background: #fff;
        }

        .website-preview-document {
          width: var(
            --website-preview-width
          );
          min-height: 720px;
          background: #fff;
        }

        @supports (
          zoom: 1
        ) {
          .website-preview-stage {
            zoom: calc(
              min(
                1,
                100cqw /
                  var(
                    --website-preview-width
                  )
              )
            );
          }
        }

        @supports not (
          zoom: 1
        ) {
          .website-preview-scroll {
            container-type: inline-size;
          }

          .website-preview-stage {
            transform: scale(
              min(
                1,
                calc(
                  100cqw /
                    var(
                      --website-preview-width
                    )
                )
              )
            );
          }
        }

        .website-preview-mobile {
          max-width: 430px;
          margin-inline: auto;
        }

        .website-preview-tablet {
          max-width: 930px;
          margin-inline: auto;
        }
      `}</style>
    </div>
  );
}
