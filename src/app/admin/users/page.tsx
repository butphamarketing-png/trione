"use client";

import { useState } from "react";
import { AdminTable } from "@/components/admin-table";
import { adminUsers } from "@/data/staff";

export default function UsersPage() {
  const [rows, setRows] = useState(
    adminUsers.map((u, i) => [String(i + 1), u.name, u.user, u.role, u.status])
  );
  const [name, setName] = useState("");
  const [user, setUser] = useState("");
  const [role, setRole] = useState("Nhân viên");

  function add() {
    if (!name.trim() || !user.trim()) return;
    setRows((prev) => [...prev, [String(prev.length + 1), name.trim(), user.trim(), role, "Hoạt động"]]);
    setName("");
    setUser("");
  }

  return (
    <div>
      <div className="mb-4 max-w-3xl rounded-sm border-t-4 border-[#2f6fed] bg-white p-4">
        <p className="mb-3 font-semibold">Tạo tài khoản (demo)</p>
        <div className="grid gap-2 sm:grid-cols-4">
          <input value={name} onChange={(e) => setName(e.target.value)} className="rounded border px-3 py-2 text-sm" placeholder="Họ tên" />
          <input value={user} onChange={(e) => setUser(e.target.value)} className="rounded border px-3 py-2 text-sm" placeholder="Tài khoản" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded border px-3 py-2 text-sm">
            <option>Quản trị</option>
            <option>Nhân viên</option>
            <option>Cộng tác viên</option>
          </select>
          <button type="button" onClick={add} className="rounded bg-[#2f6fed] px-3 py-2 text-sm text-white">
            + Thêm user
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">Phân quyền Admin / Nhân viên / CTV theo hợp đồng. Mật khẩu demo: 123456.</p>
      </div>
      <AdminTable title="Quản lý user" columns={["STT", "Họ tên", "Tài khoản", "Vai trò", "Trạng thái"]} rows={rows} />
    </div>
  );
}
