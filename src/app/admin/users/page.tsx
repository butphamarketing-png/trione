"use client";

import { useEffect, useState } from "react";
import { AdminTable } from "@/components/admin-table";
import { accountRoles, readAccounts, saveAccounts, type Account, type AccountRole } from "@/lib/accounts";
import type { AdminRecord } from "@/lib/admin-records";

export default function UsersPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [name, setName] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>("Nhân viên");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setAccounts(readAccounts());
  }, []);

  function add() {
    const nextName = name.trim();
    const nextUser = user.trim();
    if (!nextName || !nextUser) {
      setError("Nhập họ tên và tài khoản.");
      setNotice("");
      return;
    }
    if (!accounts || accounts.some((item) => item.user.toLowerCase() === nextUser.toLowerCase())) {
      setError("Tài khoản này đã có.");
      setNotice("");
      return;
    }
    const next = saveAccounts([
      ...accounts,
      {
        id: `${Date.now()}`,
        name: nextName,
        user: nextUser,
        role,
        status: "Hoạt động",
        password: password.trim() || "123456",
      },
    ]);
    setAccounts(next);
    setName("");
    setUser("");
    setPassword("");
    setRole("Nhân viên");
    setError("");
    setNotice(`Đã tạo ${nextUser} với quyền ${role}.`);
  }

  function sync(records: AdminRecord[]) {
    const previous = readAccounts();
    const next = saveAccounts(
      records.map((record) => {
        const username = record.cells[2]?.trim() ?? "";
        const existing = previous.find((item) => item.id === record.id || item.user.toLowerCase() === username.toLowerCase());
        return {
          id: existing?.id || record.id,
          name: record.cells[1]?.trim() ?? "",
          user: username,
          role: record.cells[3] ?? "Nhân viên",
          status: record.cells[4] === "Ngưng" ? "Ngưng" : "Hoạt động",
          password: existing?.password || "123456",
        };
      })
    );
    setAccounts(next);
  }

  if (!accounts) return <div className="rounded-sm border-t-4 border-[#2f6fed] bg-white p-4 text-sm text-zinc-500">Đang tải...</div>;

  const rows = accounts.map((item, index) => [String(index + 1), item.name, item.user, item.role, item.status]);

  return (
    <div>
      <div className="mb-4 max-w-4xl rounded-sm border-t-4 border-[#2f6fed] bg-white p-4">
        <p className="mb-1 font-semibold">Tạo tài khoản</p>
        <p className="mb-3 text-xs text-zinc-500">Admin tạo tài khoản và phân quyền Quản trị, Nhân viên hoặc Cộng tác viên.</p>
        <div className="grid gap-2 sm:grid-cols-5">
          <input value={name} onChange={(event) => setName(event.target.value)} className="rounded border px-3 py-2 text-sm" placeholder="Họ tên" />
          <input value={user} onChange={(event) => setUser(event.target.value)} className="rounded border px-3 py-2 text-sm" placeholder="Tài khoản" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} className="rounded border px-3 py-2 text-sm" placeholder="Mật khẩu" />
          <select value={role} onChange={(event) => setRole(event.target.value as AccountRole)} className="rounded border px-3 py-2 text-sm">
            {accountRoles.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button type="button" onClick={add} className="rounded bg-[#2f6fed] px-3 py-2 text-sm text-white">
            + Tạo tài khoản
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">Để trống mật khẩu thì mật khẩu là 123456. Tài khoản Ngưng không đăng nhập được.</p>
        {notice ? <p className="mt-2 text-sm text-emerald-600">{notice}</p> : null}
        {error ? <p className="mt-2 text-sm text-[#e11d2e]">{error}</p> : null}
      </div>
      <AdminTable title="Quản lý user" columns={["STT", "Họ tên", "Tài khoản", "Vai trò", "Trạng thái"]} rows={rows} live onCommit={sync} />
    </div>
  );
}
