"use client";
import type { AttendanceDevice } from "../../../components/attendance/capture/types";

export interface AttendanceDeviceSelectorProps {
  devices: readonly AttendanceDevice[];
  value?: string | null;
  onChange: (deviceId: string | null, device?: AttendanceDevice) => void;
  disabled?: boolean;
  label?: string;
}
export function AttendanceDeviceSelector({ devices, value, onChange, disabled=false, label="Capture device" }: AttendanceDeviceSelectorProps) {
  const active=devices.filter(d=>d.active!==false && !d.isDeleted);
  return <label style={{display:"grid",gap:5,fontSize:11,fontWeight:750}}>
    <span>{label}</span>
    <select value={value??""} disabled={disabled} onChange={e=>{const id=e.target.value||null;onChange(id,active.find(d=>d.id===id));}} style={{minHeight:36,borderRadius:9,border:"1px solid var(--border,rgba(15,23,42,.12))",background:"var(--background,#fff)",color:"inherit",padding:"0 9px"}}>
      <option value="">This device / none</option>
      {active.map(d=><option key={d.id} value={d.id}>{d.name}{d.locationLabel?` · ${d.locationLabel}`:""}</option>)}
    </select>
  </label>;
}
export default AttendanceDeviceSelector;
