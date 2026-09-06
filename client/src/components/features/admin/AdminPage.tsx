import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Database, Download, FileJson, RefreshCw, Search, ShieldCheck, Users, X } from "lucide-react";
import { AdminOverview, AdminUserData, AdminUserSummary, api, authStorage } from "../../../services/api";
import { BrandLogo } from "../../ui/branding/BrandLogo";
import { SeoHead } from "../marketing/SeoHead";

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

const getAdminLoginPath = () => "/login?returnTo=%2Fadmin&force=1";

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!authStorage.getToken()) {
      setError("Bạn cần đăng nhập để mở trang quản trị.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const [overviewResponse, usersResponse] = await Promise.all([
      api.admin.getOverview(),
      api.admin.listUsers(search, page),
    ]);

    if (!overviewResponse.success || !usersResponse.success) {
      setError(overviewResponse.message || usersResponse.message || "Không thể tải dữ liệu quản trị.");
      setIsLoading(false);
      return;
    }

    if (overviewResponse.data) setOverview(overviewResponse.data);
    if (usersResponse.data) {
      setUsers(usersResponse.data.items);
      setTotalPages(usersResponse.data.pagination.totalPages);
      setTotalUsers(usersResponse.data.pagination.total);
    }
    setIsLoading(false);
  }, [page, search]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSelectUser = async (user: AdminUserSummary) => {
    setIsDetailLoading(true);
    setError(null);
    const response = await api.admin.getUserData(user.id);
    if (!response.success || !response.data) {
      setError(response.message || "Không thể tải dữ liệu tài khoản.");
      setIsDetailLoading(false);
      return;
    }
    setSelectedUser(response.data);
    setIsDetailLoading(false);
  };

  const handleDownload = () => {
    if (!selectedUser) return;
    const blob = new Blob([JSON.stringify(selectedUser, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sketchtask-${selectedUser.user.email}-${selectedUser.user.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totals = overview?.totals;

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1C1917] font-sans">
      <SeoHead
        title="Quản trị dữ liệu | SketchTask"
        description="Khu vực quản trị dữ liệu SketchTask."
        path="/admin"
      />

      <header className="sticky top-0 z-30 bg-[#FBF9F4] border-b-[1.5px] border-[#262626] shadow-[0px_2px_0px_#262626] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo size="md" />
          <span className="hidden sm:inline text-xs font-mono text-[#78716C] border-l border-[#D4CEBF] pl-3">ADMIN</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("/app")}
            className="h-8 px-2.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-xs font-bold flex items-center gap-1.5 hover:bg-[#FEF08A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Về ứng dụng</span>
          </button>
          <button
            type="button"
            onClick={() => void loadData()}
            className="w-8 h-8 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-center hover:bg-[#BBF7D0] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            aria-label="Tải lại dữ liệu"
            title="Tải lại"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <main className="w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        <section className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center">
              <ShieldCheck size={19} strokeWidth={2.3} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Quản trị dữ liệu</h1>
              <p className="text-xs text-[#78716C]">Xem tài khoản, kiểm tra dữ liệu và xuất bản sao an toàn.</p>
            </div>
          </div>
        </section>

        {error && (
          <section className="p-3 bg-[#FECDD3] border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] flex items-start justify-between gap-3">
            <p className="text-xs font-bold text-rose-950">{error}</p>
            <button type="button" onClick={() => setError(null)} aria-label="Đóng lỗi"><X size={15} /></button>
          </section>
        )}

        {!authStorage.getToken() || error?.includes("không có quyền") || error?.includes("đăng nhập") ? (
          <section className="max-w-lg bg-white border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] p-5 space-y-3">
            <h2 className="font-bold">Không thể mở khu vực quản trị</h2>
            <p className="text-sm text-[#78716C]">Hãy đăng nhập bằng tài khoản được cấp trong biến môi trường `ADMIN_EMAILS` của server.</p>
            <button type="button" onClick={() => onNavigate(getAdminLoginPath())} className="h-9 px-3 bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-xs font-bold active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">Đăng nhập</button>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: "Người dùng", value: totals?.users ?? 0, icon: Users, color: "bg-[#FEF08A]" },
                { label: "Task", value: totals?.tasks ?? 0, icon: FileJson, color: "bg-[#BAE6FD]" },
                { label: "Sổ tay", value: totals?.notebooks ?? 0, icon: Database, color: "bg-[#DDD6FE]" },
                { label: "Thói quen", value: totals?.habits ?? 0, icon: RefreshCw, color: "bg-[#BBF7D0]" },
                { label: "Sticky note", value: totals?.stickyNotes ?? 0, icon: FileJson, color: "bg-[#FECDD3]" },
              ].map(({ label, value, icon: StatIcon, color }) => {
                return (
                  <div key={label} className="bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] p-3">
                    <div className={`w-7 h-7 ${color} border border-[#262626] rounded-[4px] flex items-center justify-center mb-2`}><StatIcon size={15} strokeWidth={2.3} /></div>
                    <p className="text-xl font-black font-mono">{value}</p>
                    <p className="text-[11px] text-[#78716C] font-bold">{label}</p>
                  </div>
                );
              })}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)] gap-5 items-start">
              <div className="bg-white border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] p-4">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#D4CEBF]">
                  <div>
                    <h2 className="font-bold">Tài khoản người dùng</h2>
                    <p className="text-[11px] text-[#78716C]">{totalUsers} tài khoản · chọn một dòng để xem dữ liệu</p>
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      setPage(1);
                      setSearch(searchInput.trim());
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <div className="relative">
                      <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#78716C]" />
                      <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm email/tên" className="w-36 sm:w-52 h-8 pl-7 pr-2 bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[4px] text-xs outline-none focus:ring-1 focus:ring-[#262626]" />
                    </div>
                    <button type="submit" className="h-8 px-2 bg-[#BAE6FD] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-xs font-bold active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">Lọc</button>
                  </form>
                </div>

                <div className="mt-3 space-y-2">
                  {isLoading ? (
                    <p className="py-8 text-center text-xs text-[#78716C]">Đang tải dữ liệu...</p>
                  ) : users.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[#78716C]">Không tìm thấy tài khoản.</p>
                  ) : (
                    users.map((user) => (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => void handleSelectUser(user)}
                        className={`w-full text-left flex items-center gap-3 p-2.5 border-[1.5px] border-[#262626] rounded-[5px] shadow-[1px_1px_0px_#262626] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${selectedUser?.user.id === user.id ? "bg-[#FEF08A]" : "bg-[#FAF8F3] hover:bg-[#FFFDEB]"}`}
                      >
                        <div className="w-8 h-8 shrink-0 bg-[#BBF7D0] border border-[#262626] rounded-[4px] flex items-center justify-center text-xs font-bold">{getInitials(user.name)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{user.name}</p>
                          <p className="text-[10px] text-[#78716C] truncate">{user.email}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-[#78716C] shrink-0">
                          <span>{user._count.tasks} task</span>
                          <span>·</span>
                          <span>{user._count.notebooks} sổ</span>
                        </div>
                        <span className="text-[10px] text-[#78716C] shrink-0">{formatDate(user.createdAt)}</span>
                      </button>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#D4CEBF] text-[11px] text-[#78716C]">
                  <span>Trang {page}/{totalPages}</span>
                  <div className="flex gap-1.5">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="h-7 px-2 bg-white border border-[#262626] rounded-[4px] disabled:opacity-40">Trước</button>
                    <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="h-7 px-2 bg-white border border-[#262626] rounded-[4px] disabled:opacity-40">Sau</button>
                  </div>
                </div>
              </div>

              <aside className="bg-white border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] p-4 xl:sticky xl:top-20">
                {isDetailLoading ? (
                  <p className="py-12 text-center text-xs text-[#78716C]">Đang tải dữ liệu tài khoản...</p>
                ) : !selectedUser ? (
                  <div className="py-12 text-center space-y-2 text-[#78716C]">
                    <Database size={28} className="mx-auto" />
                    <p className="text-sm font-bold text-[#1C1917]">Chưa chọn tài khoản</p>
                    <p className="text-xs">Chọn một tài khoản bên trái để xem chi tiết.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#D4CEBF]">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-[#78716C]">CHI TIẾT TÀI KHOẢN</p>
                        <h2 className="font-bold truncate mt-0.5">{selectedUser.user.name}</h2>
                        <p className="text-xs text-[#78716C] truncate">{selectedUser.user.email}</p>
                      </div>
                      <button type="button" onClick={handleDownload} className="h-8 px-2 bg-[#BBF7D0] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-[10px] font-bold flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"><Download size={13} /> JSON</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {[
                        ["Task", selectedUser.tasks.length],
                        ["Sổ tay", selectedUser.notebooks.length],
                        ["Thói quen", selectedUser.habits.length],
                        ["Sticky note", selectedUser.stickyNotes.length],
                        ["Tag", selectedUser.tags.length],
                        ["Mood", Object.keys(selectedUser.dailyMoods).length],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="p-2 bg-[#FAF8F3] border border-[#D4CEBF] rounded-[4px]"><p className="text-lg font-black font-mono">{value}</p><p className="text-[10px] text-[#78716C]">{label}</p></div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#D4CEBF] space-y-1 text-[11px] text-[#78716C]">
                      <p>Tham gia: {formatDate(selectedUser.user.createdAt)}</p>
                      <p>Cập nhật: {formatDate(selectedUser.user.updatedAt)}</p>
                      <p className="pt-1 text-amber-800">Ghi chú thường và nhật ký: chỉ có ở local client hiện tại.</p>
                    </div>
                  </>
                )}
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
