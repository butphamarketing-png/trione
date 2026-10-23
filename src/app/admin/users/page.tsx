"use client";

import { useEffect, useRef, useState } from "react";
import { AdminTable } from "@/components/admin-table";
import {
  accountRoles,
  readAccounts,
  saveAccounts,
  saveAccountsAndSync,
  type Account,
  type AccountRole,
  type AccountStatus,
} from "@/lib/accounts";
import type { AdminRecord } from "@/lib/admin-records";

type PasswordDraft = { password: string; confirm: string; id: string; user: string };

export default function UsersPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [name, setName] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>("Nhân viên");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [passwordKey, setPasswordKey] = useState(0);
  const passwordDraft = useRef<PasswordDraft>({ password: "", confirm: "", id: "", user: "" });

  useEffect(() => {
    let cancelled = false;
    void import("@/lib/catalog-sync").then(async (mod) => {
      await mod.ensureCatalog();
      if (!cancelled) setAccounts(readAccounts());
    });
    const refresh = () => setAccounts(readAccounts());
    window.addEventListener("trione-catalog", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("trione-catalog", refresh);
    };
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

  function checkPassword(record: AdminRecord) {
    const draft = passwordDraft.current;
    const next = draft.password.trim();
    const again = draft.confirm.trim();
    draft.id = record.id;
    draft.user = record.cells[2]?.trim() ?? "";
    if (!next && !again) return "";
    if (next.length < 6) return "Mật khẩu mới cần ít nhất 6 ký tự.";
    if (next !== again) return "Mật khẩu nhập lại chưa khớp.";
    return "";
  }

  async function sync(records: AdminRecord[]) {
    const previous = readAccounts();
    const draft = passwordDraft.current;
    const nextPassword = draft.password.trim();
    const draftUser = draft.user.trim().toLowerCase();
    const changingId = draft.id;
    const next = records.map((record) => {
      const username = record.cells[2]?.trim() ?? "";
      const existing = previous.find((item) => item.id === record.id || item.user.toLowerCase() === username.toLowerCase());
      const changing =
        Boolean(nextPassword) &&
        (record.id === changingId || (draftUser !== "" && username.toLowerCase() === draftUser));
      const status: AccountStatus = record.cells[4] === "Ngưng" ? "Ngưng" : "Hoạt động";
      return {
        id: existing?.id || record.id,
        name: record.cells[1]?.trim() ?? "",
        user: username,
        role: (record.cells[3] ?? "Nhân viên") as AccountRole,
        status,
        password: changing ? nextPassword : existing?.password || "123456",
      };
    });
    if (nextPassword) {
      passwordDraft.current = { password: "", confirm: "", id: "", user: "" };
      setPasswordKey((value) => value + 1);
      setAccounts(await saveAccountsAndSync(next));
      return;
    }
    setAccounts(saveAccounts(next));
  }

  if (!accounts) return <div className="rounded-sm border-t-4 border-[#2f6fed] bg-white p-4 text-sm text-zinc-500">Đang tải...</div>;

  const rows = accounts.map((item, index) => [String(index + 1), item.name, item.user, item.role, item.status]);

  return (
    <div>
      <div className="mb-4 max-w-4xl rounded-sm border-t-4 border-[#2f6fed] bg-white p-4">
        <p className="mb-1 font-semibold">Tạo tài khoản</p>
        <p className="mb-3 text-xs text-zinc-500">Admin tạo tài khoản và phân quyền Quản trị, Nhân viên, Khách hàng hoặc Cộng tác viên. Khách hàng đăng nhập xong vào trang thu cũ.</p>
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
      <AdminTable
        title="Quản lý user"
        columns={["STT", "Họ tên", "Tài khoản", "Vai trò", "Trạng thái"]}
        rows={rows}
        recordIds={accounts.map((item) => item.id)}
        live
        allowCreate={false}
        onCommit={sync}
        beforeSave={checkPassword}
        renderExtra={(mode) => <PasswordFields key={passwordKey} mode={mode} draft={passwordDraft} />}
      />
    </div>
  );
}

function PasswordFields({
  mode,
  draft,
}: {
  mode: "add" | "edit" | "view";
  draft: { current: PasswordDraft };
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const readOnly = mode === "view";

  function update(patch: Partial<PasswordDraft>) {
    draft.current = { ...draft.current, ...patch };
  }

  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-2">
      <label className="block text-sm">
        <span className="mb-1 block">Mật khẩu mới</span>
        <input
          type="password"
          value={password}
          disabled={readOnly}
          autoComplete="new-password"
          placeholder="Để trống nếu giữ mật khẩu cũ"
          onChange={(event) => {
            const value = event.target.value;
            setPassword(value);
            update({ password: value });
          }}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#e2b100] disabled:bg-zinc-50"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block">Nhập lại mật khẩu</span>
        <input
          type="password"
          value={confirm}
          disabled={readOnly}
          autoComplete="new-password"
          onChange={(event) => {
            const value = event.target.value;
            setConfirm(value);
            update({ confirm: value });
          }}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#e2b100] disabled:bg-zinc-50"
        />
      </label>
    </div>
  );
}
