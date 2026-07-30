import type {
  IdentityAccessPoint, IdentityAccessPointType, IdentityDevice,
  IdentityDeviceCapability, IdentityDeviceType,
} from "../../lib/db/db";

export type IdentityDeviceStatus = NonNullable<IdentityDevice["status"]>;

export interface IdentityDeviceDraft {
  name:string; code?:string|null; deviceType:IdentityDeviceType;
  provider?:string|null; providerDeviceId?:string|null; serialNumber?:string|null;
  platform?:string|null; appVersion?:string|null; firmwareVersion?:string|null;
  accessPointId?:string|null; locationLabel?:string|null;
  latitude?:number|null; longitude?:number|null;
  capabilities?:IdentityDeviceCapability[]; status?:IdentityDeviceStatus;
  active?:boolean; metadata?:Record<string,unknown>;
}
export interface IdentityAccessPointDraft {
  name:string; code?:string|null; accessPointType:IdentityAccessPointType;
  organizationId?:string|null; classId?:string|null; vehicleId?:string|null;
  locationLabel?:string|null; latitude?:number|null; longitude?:number|null;
  allowedRadiusMeters?:number|null; active?:boolean; metadata?:Record<string,unknown>;
}
export interface IdentityAccessPointOption {
  id:string; name:string; code?:string|null;
  accessPointType?:IdentityAccessPointType; locationLabel?:string|null;
}
export type { IdentityAccessPoint, IdentityAccessPointType, IdentityDevice, IdentityDeviceCapability, IdentityDeviceType };
