"use client";

import { useState } from "react";

import type {
  IdentityAccessPointDraft,
  IdentityAccessPointType,
} from "../infrastructure-types";

import {
  AccessPointGeofenceEditor,
  type AccessPointGeofenceValue,
} from "./AccessPointGeofenceEditor";

export interface AccessPointFormProps {
  initialValue?: Partial<IdentityAccessPointDraft>;

  onSubmit: (
    draft: IdentityAccessPointDraft,
  ) => void | Promise<void>;

  disabled?: boolean;
  submitLabel?: string;
}

export function AccessPointForm({
  initialValue,
  onSubmit,
  disabled = false,
  submitLabel = "Save access point",
}: AccessPointFormProps) {
  const [name, setName] = useState(
    initialValue?.name ?? "",
  );

  const [code, setCode] = useState(
    initialValue?.code ?? "",
  );

  const [accessPointType, setAccessPointType] =
    useState<IdentityAccessPointType>(
      initialValue?.accessPointType ??
        "school_gate",
    );

  const [locationLabel, setLocationLabel] =
    useState(
      initialValue?.locationLabel ?? "",
    );

  const [active, setActive] = useState(
    initialValue?.active ?? true,
  );

  const [geofence, setGeofence] =
    useState<AccessPointGeofenceValue>({
      latitude:
        initialValue?.latitude ?? null,

      longitude:
        initialValue?.longitude ?? null,

      radiusMeters:
        initialValue?.allowedRadiusMeters ??
        50,

      locationLabel:
        initialValue?.locationLabel ?? null,
    });

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      return;
    }

    await onSubmit({
      name: cleanName,

      code:
        code.trim() || null,

      accessPointType,

      locationLabel:
        geofence.locationLabel?.trim() ||
        locationLabel.trim() ||
        null,

      latitude:
        geofence.latitude,

      longitude:
        geofence.longitude,

      allowedRadiusMeters:
        geofence.radiusMeters,

      active,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 10,
      }}
    >
      <label>
        Name

        <input
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          disabled={disabled}
          required
        />
      </label>

      <label>
        Code

        <input
          value={code}
          onChange={(event) =>
            setCode(event.target.value)
          }
          disabled={disabled}
        />
      </label>

      <label>
        Type

        <select
          value={accessPointType}
          onChange={(event) =>
            setAccessPointType(
              event.target
                .value as IdentityAccessPointType,
            )
          }
          disabled={disabled}
        >
          <option value="school_gate">
            School gate
          </option>

          <option value="branch_gate">
            Branch gate
          </option>

          <option value="classroom">
            Classroom
          </option>

          <option value="staff_office">
            Staff office
          </option>

          <option value="reception">
            Reception
          </option>

          <option value="pickup_desk">
            Pickup desk
          </option>

          <option value="bus">
            Bus
          </option>

          <option value="bus_stop">
            Bus stop
          </option>

          <option value="assembly_point">
            Assembly point
          </option>

          <option value="custom">
            Custom
          </option>
        </select>
      </label>

      <label>
        Location label

        <input
          value={locationLabel}
          onChange={(event) =>
            setLocationLabel(
              event.target.value,
            )
          }
          disabled={disabled}
        />
      </label>

      <AccessPointGeofenceEditor
        value={geofence}
        onChange={setGeofence}
        disabled={disabled}
      />

      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <input
          type="checkbox"
          checked={active}
          onChange={(event) =>
            setActive(
              event.target.checked,
            )
          }
          disabled={disabled}
        />

        Active
      </label>

      <button
        type="submit"
        disabled={
          disabled ||
          !name.trim()
        }
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default AccessPointForm;