"use client";

import { useEffect, useState } from "react";
import { readAccounts } from "@/lib/accounts";
import { readSession } from "@/lib/session";
import { readStaffProfile, saveStaffProfile, type StaffProfile } from "@/lib/staff-profile";

const inputClass = "mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#e11d2e]";

export default function StaffAccountPage() {
  const [user, setUser] = useState("");
  const [profile, setProfile] = useState<StaffProfile>({ name: "", address: "", phone: "" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const session = readSession();
    const account = session?.user || "nv.anh";
    const official = readAccounts().find((item) => item.user.toLowerCase() === account.toLowerCase());
    setUser(account);
    const stored = readStaffProfile(account, official?.name || session?.name || "");
    setProfile({ ...stored, name: official?.name || stored.name });
  }, []);

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile.name.trim() || !profile.address.trim() || !profile.phone.trim()) {
      setNotice("Nhập đủ tên, địa chỉ và số điện thoại.");
      return;
    }
    setProfile(saveStaffProfile(user, profile));
    setNotice("Đã lưu thông tin tài khoản.");
  }

  return (
    <div>
      <h1 className="text-[26px] font-bold">Tài khoản</h1>
      <p className="text-sm text-zinc-500">Thông tin tài khoản nhân viên</p>
      <form onSubmit={save} className="mt-6 max-w-xl rounded-2xl bg-white p-5">
        <p className="mb-4 text-xs text-zinc-400">Tài khoản: {user}</p>
        <label className="mb-3 block text-sm">
          Tên
          <input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className={inputClass} />
        </label>
        <label className="mb-3 block text-sm">
          Địa chỉ
          <textarea
            value={profile.address}
            rows={3}
            onChange={(event) => setProfile({ ...profile, address: event.target.value })}
            className={inputClass}
          />
        </label>
        <label className="mb-4 block text-sm">
          Số điện thoại
          <input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className={inputClass} />
        </label>
        <button type="submit" className="rounded-lg bg-[#e11d2e] px-4 py-2.5 text-sm font-semibold text-white">
          Lưu
        </button>
        {notice ? <p className={`mt-3 text-sm ${notice.startsWith("Đã") ? "text-emerald-600" : "text-[#e11d2e]"}`}>{notice}</p> : null}
      </form>
    </div>
  );
}
