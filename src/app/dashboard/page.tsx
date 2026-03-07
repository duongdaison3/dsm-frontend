'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
    sub: string;
    role: 'admin' | 'depart' | 'staff';
    [key: string]: unknown;
}

interface Note {
    highlight: string;
    follow_up: string;
    blockers: string;
    one_percent_better?: string | null;
    meeting_notes?: string | null;
    planned_tasks?: string | null;
    [key: string]: unknown;
}

export default function DashboardPage() {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [viewRole, setViewRole] = useState<string>('');

    // State Profile Modal
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [profileDob, setProfileDob] = useState('');
    const [profileAvatar, setProfileAvatar] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    const [streakDates, setStreakDates] = useState<string[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [viewingNote, setViewingNote] = useState<Note | null>(null);
    const [showPopup, setShowPopup] = useState(false);

    // State Form
    const [highlight, setHighlight] = useState('');
    const [followUp, setFollowUp] = useState('');
    const [blockers, setBlockers] = useState('');
    const [onePercentBetter, setOnePercentBetter] = useState('');
    const [meetingNotes, setMeetingNotes] = useState(''); // Thêm mới
    const [plannedTasks, setPlannedTasks] = useState(''); // Thêm mới
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.style.height = 'auto'; // Reset chiều cao trước
        e.target.style.height = `${e.target.scrollHeight}px`; // Đặt lại chiều cao bằng với nội dung
    };

    // State AI Report (Thứ 6)
    const [aiReport, setAiReport] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Admin Form
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('staff');
    const [adminMsg, setAdminMsg] = useState('');

    interface AdminStats {
        fully_completed_count: number;
        yesterday_str: string;
        submitted_count: number;
        total_employees: number;
        blockers: string[];
    }

    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

    // 1. INIT
    useEffect(() => {
        const initDashboard = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) return router.push('/login');
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserData(payload);
                setViewRole(payload.role);
                fetchStreak(token);

                // NẾU LÀ ADMIN, GỌI API THỐNG KÊ DATA HÔM QUA
                if (payload.role === 'admin') {
                    const res = await fetch('http://localhost:8000/notes/admin/stats', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) setAdminStats(await res.json());
                }
            } catch (error) { router.push('/login'); }
        };
        initDashboard();
    }, [router]);

    const fetchStreak = async (token: string) => {
        try {
            const res = await fetch('http://localhost:8000/notes/streak', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setStreakDates(await res.json());
        } catch (e) { }
    };

    // 2. PROFILE LOGIC
    const handleOpenProfile = async () => {
        setShowProfileModal(true);
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch('http://localhost:8000/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setProfileName(data.full_name || ''); setProfileDob(data.dob || ''); setProfileAvatar(data.avatar_url || '');
            }
        } catch (e) { }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault(); setIsUpdatingProfile(true);
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch('http://localhost:8000/users/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ full_name: profileName, dob: profileDob || null, avatar_url: profileAvatar || null })
            });
            if (res.ok) { alert('Cập nhật hồ sơ thành công!'); setShowProfileModal(false); setUserData(userData ? { ...userData, sub: profileName } : null); }
        } catch (e) { } finally { setIsUpdatingProfile(false); }
    };

    // 3. CALENDAR LOGIC
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleDateClick = async (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const isoDate = new Date(clickedDate.getTime() - (clickedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        setSelectedDate(clickedDate); setViewingNote(null); setShowPopup(false); setAiReport('');
        if (clickedDate > today) return;
        if (clickedDate.getTime() === today.getTime()) return;

        if (streakDates.includes(isoDate)) {
            const token = localStorage.getItem('access_token');
            try {
                const res = await fetch(`http://localhost:8000/notes/${isoDate}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) setViewingNote(await res.json());
            } catch (e) { }
        } else { setShowPopup(true); }
    };

    // 4. SUBMIT DAILY NOTE
    const handleSubmitNote = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch('http://localhost:8000/notes/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    highlight, follow_up: followUp, blockers,
                    one_percent_better: viewRole === 'staff' ? onePercentBetter : null,
                    meeting_notes: meetingNotes || null,
                    planned_tasks: (viewRole === 'depart') ? plannedTasks : null
                }),
            });
            if (!res.ok) throw new Error((await res.json()).detail);
            alert("Đã lưu nhật ký thành công!");
            setHighlight(''); setFollowUp(''); setBlockers(''); setOnePercentBetter(''); setMeetingNotes(''); setPlannedTasks('');
            fetchStreak(token!);
        } catch (e: Error | unknown) { alert("Lỗi: " + (e instanceof Error ? e.message : 'Lỗi không xác định')); } finally { setIsSubmitting(false); }
    };

    // 5. GEN AI LOGIC (CHỈ DÙNG CHO THỨ 6)
    const handleGenerateAIReport = async () => {
        if (!selectedDate) return;
        setIsGeneratingAI(true);
        const token = localStorage.getItem('access_token');

        // Tìm ngày Thứ 2 của tuần chứa selectedDate
        const monday = new Date(selectedDate);
        const day = monday.getDay() || 7;
        if (day !== 1) monday.setHours(-24 * (day - 1));

        try {
            // Gọi API gom data từ thứ 2 đến thứ 6 (Giả lập việc gọi 5 API cho nhanh)
            let weeklyDataText = `Vai trò: ${viewRole.toUpperCase()}\n\n`;
            for (let i = 0; i < 5; i++) {
                const d = new Date(monday); d.setDate(monday.getDate() + i);
                const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

                if (streakDates.includes(iso)) {
                    const res = await fetch(`http://localhost:8000/notes/${iso}`, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (res.ok) {
                        const note = await res.json();
                        weeklyDataText += `--- Ngày ${iso} ---\nHighlight: ${note.highlight}\nBlockers: ${note.blockers}\n`;
                        if (note.planned_tasks) weeklyDataText += `Kế hoạch Tuần (Set from Monday): ${note.planned_tasks}\n`;
                    }
                }
            }

            // Bắn cục data này lên Gemini
            const aiRes = await fetch('http://localhost:8000/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekly_notes: weeklyDataText })
            });
            const aiData = await aiRes.json();
            setAiReport(aiData.ai_summary);

        } catch (e) { alert("Lỗi khi gọi AI"); } finally { setIsGeneratingAI(false); }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch('http://localhost:8000/users/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newName, role: newRole })
            });
            if (!res.ok) throw new Error((await res.json()).detail);
            setAdminMsg('Tạo tài khoản thành công!');
            setNewEmail('');
            setNewPassword('');
            setNewName('');
            setNewRole('staff');
            setTimeout(() => setAdminMsg(''), 3000);
        } catch (e: Error | unknown) {
            setAdminMsg('Lỗi: ' + (e instanceof Error ? e.message : 'Lỗi không xác định'));
        }
    };

    const handleLogout = () => { localStorage.removeItem('access_token'); router.push('/login'); };

    // Xác định thứ trong tuần của ngày đang chọn (0: CN, 1: T2, ..., 5: T6)
    const dayOfWeek = selectedDate ? selectedDate.getDay() : -1;

    if (!userData) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8 text-black">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="bg-white rounded-xl shadow p-6 flex justify-between items-center border-b-4 border-blue-600">
                    <div className="flex items-center space-x-4 md:space-x-6">

                        {/* THÊM LOGO CÔNG TY VÀO ĐÂY */}
                        <img src="/logo.png" alt="TOTAL Logo" className="h-10 md:h-12 object-contain" />

                        {/* Thanh gạch dọc phân cách cho thanh lịch */}
                        <div className="h-10 w-px bg-gray-300 hidden md:block"></div>

                        {/* Avatar & Lời chào */}
                        <div className="flex items-center space-x-4">
                            {profileAvatar ? (
                                <img src={profileAvatar} className="w-12 h-12 rounded-full border border-gray-200 object-cover shadow-sm" />
                            ) : (
                                <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-xl shadow-sm">👤</div>
                            )}
                            <div>
                                <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">DSM Workspace</h1>
                                <p className="text-gray-500 text-sm">Xin chào, <span className="font-bold text-blue-600">{profileName || userData.sub}</span></p>
                            </div>
                            {userData.role === 'admin' && (
                                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                                    <span className="text-sm font-medium text-blue-800">Góc nhìn:</span>
                                    <select className="text-sm bg-transparent font-bold text-blue-600 focus:outline-none cursor-pointer"
                                        value={viewRole} onChange={(e) => setViewRole(e.target.value)}>
                                        <option value="admin">Quản trị viên (Admin)</option>
                                        <option value="depart">Trưởng phòng (Depart)</option>
                                        <option value="staff">Nhân viên (Staff)</option>
                                    </select>
                                </div>
                            )}
                            <button onClick={handleLogout} className="px-5 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition shadow-sm">
                                Đăng xuất
                            </button>
                        </div>

                    </div>
                </div>

                {/* ================= GIAO DIỆN ADMIN ================= */}
                {viewRole === 'admin' && (
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-6">
                            <div className="bg-white rounded-xl shadow p-6 border-t-4 border-indigo-500">
                                <h2 className="font-bold text-xl text-gray-800 mb-6">
                                    📊 Thống kê (Hôm qua: {typeof adminStats?.yesterday_str === 'string' ? adminStats.yesterday_str : '...'})
                                </h2>

                                {/* HIỂN THỊ TRẠNG THÁI VỚI PROGRESS BAR */}
                                {!adminStats ? (
                                    <div className="text-gray-500 italic py-8 text-center animate-pulse">Đang tải dữ liệu...</div>
                                ) : adminStats.total_employees === 0 ? (
                                    <div className="text-gray-500 italic py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        Chưa có nhân sự nào trong hệ thống (Không tính Admin). Hãy tạo tài khoản mới!
                                    </div>
                                ) : adminStats.submitted_count === 0 ? (
                                    <div className="text-gray-500 italic py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        Chưa có bất kỳ dữ liệu nhật ký nào được ghi nhận vào ngày hôm qua.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                        {/* Thẻ 1: Tỷ lệ Chuyên cần */}
                                        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-sm flex flex-col justify-center">
                                            <p className="text-sm text-indigo-600 font-bold uppercase mb-2">Tỷ lệ nộp nhật ký</p>
                                            <div className="flex items-end space-x-2">
                                                <p className="text-4xl font-black text-indigo-900">{Math.round((adminStats.submitted_count / adminStats.total_employees) * 100)}%</p>
                                                <p className="text-sm text-indigo-500 mb-1 font-medium">{adminStats.submitted_count} / {adminStats.total_employees} nhân sự</p>
                                            </div>
                                            <div className="w-full bg-indigo-200 rounded-full h-2.5 mt-4">
                                                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(adminStats.submitted_count / adminStats.total_employees) * 100}%` }}></div>
                                            </div>
                                        </div>

                                        {/* Thẻ 2: Chất lượng Bài viết */}
                                        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-center">
                                            <p className="text-sm text-emerald-600 font-bold uppercase mb-2">Chất lượng (Viết đủ 3 phần)</p>
                                            <div className="flex items-end space-x-2">
                                                <p className="text-4xl font-black text-emerald-900">{adminStats.fully_completed_count}</p>
                                                <p className="text-sm text-emerald-500 mb-1 font-medium">/ {adminStats.submitted_count} người đã nộp</p>
                                            </div>
                                            <div className="w-full bg-emerald-200 rounded-full h-2.5 mt-4">
                                                <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(adminStats.fully_completed_count / adminStats.submitted_count) * 100}%` }}></div>
                                            </div>
                                        </div>

                                        {/* Thẻ 3: Blockers List */}
                                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 overflow-y-auto max-h-40 shadow-sm custom-scrollbar">
                                            <p className="text-sm text-orange-600 font-bold uppercase sticky top-0 bg-orange-50 pb-1">
                                                Khó khăn ghi nhận ({adminStats.blockers.length})
                                            </p>
                                            {adminStats.blockers.length > 0 ? (
                                                <ul className="mt-2 text-sm text-orange-900 space-y-2 list-disc pl-4 marker:text-orange-400">
                                                    {adminStats.blockers.map((blocker: string, idx: number) => (
                                                        <li key={idx} className="leading-snug">{blocker}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 mt-2 italic">Mọi việc suôn sẻ, không có khó khăn nào!</p>
                                            )}
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FORM ADD TÀI KHOẢN */}
                        <div className="col-span-1 bg-white rounded-xl shadow p-6 border-t-4 border-green-500">
                            <h2 className="font-bold text-xl text-gray-800 mb-4">Thêm Nhân Sự Mới</h2>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <input type="text" placeholder="Họ và Tên" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                <input type="email" placeholder="Email đăng nhập" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                <input type="password" placeholder="Mật khẩu khởi tạo" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                                    <option value="admin">Quản trị viên (Admin)</option>
                                    <option value="staff">Nhân viên (Staff)</option>
                                    <option value="depart">Trưởng phòng (Depart)</option>
                                </select>
                                <button type="submit" className="w-full py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Tạo Tài Khoản</button>
                                {adminMsg && <p className="text-sm text-center font-semibold text-green-700 mt-2">{adminMsg}</p>}
                            </form>
                        </div>
                    </div>
                )}

                {/* GIAO DIỆN STAFF/DEPART */}
                {(viewRole === 'staff' || viewRole === 'depart') && (
                    <div className="grid grid-cols-12 gap-6">

                        {/* LỊCH (BÊN TRÁI) */}
                        <div className="col-span-4 bg-white rounded-xl shadow p-6 border-t-4 border-blue-500">
                            {/*... Lưới lịch giữ nguyên logic cũ ...*/}
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-gray-800">Lịch Hoạt Động</h3>
                                <div className="flex space-x-2">
                                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="px-3 bg-gray-100 hover:bg-gray-200 rounded">◀</button>
                                    <span className="font-bold text-sm text-gray-700 py-1">T{currentDate.getMonth() + 1} / {currentDate.getFullYear()}</span>
                                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="px-3 bg-gray-100 hover:bg-gray-200 rounded">▶</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
                                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => <div key={d}>{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="h-10"></div>)}
                                {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
                                    const day = i + 1;
                                    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                    const isoStr = new Date(dateToCheck.getTime() - (dateToCheck.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

                                    const isSubmitted = streakDates.includes(isoStr);
                                    const isToday = new Date().toDateString() === dateToCheck.toDateString();
                                    const isFuture = dateToCheck > new Date();
                                    const isSelected = selectedDate?.toDateString() === dateToCheck.toDateString();

                                    let bgColor = "bg-gray-50 hover:bg-blue-100 cursor-pointer text-sm";
                                    if (isSubmitted) bgColor = "bg-green-100 text-green-700 border-green-300 border font-bold hover:bg-green-200 text-sm";
                                    if (isFuture) bgColor = "bg-gray-50 opacity-30 cursor-not-allowed text-sm";
                                    if (isToday && !isSubmitted) bgColor = "bg-blue-50 text-blue-700 border border-blue-400 font-bold hover:bg-blue-200 text-sm";
                                    if (isSelected) bgColor += " ring-2 ring-blue-500 ring-offset-1";

                                    return (
                                        <div key={day} onClick={() => handleDateClick(day)} className={`h-10 rounded-md flex items-center justify-center transition-all relative ${bgColor}`}>
                                            {day}
                                            {isSubmitted && <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* FORM / READ MODE (BÊN PHẢI) */}
                        <div className="col-span-8 space-y-6">

                            {/* NẾU LÀ HÔM NAY -> HIỆN FORM */}
                            {selectedDate && selectedDate.toDateString() === new Date().toDateString() && (
                                <div className="bg-white rounded-xl shadow p-6 border-t-4 border-yellow-400">
                                    <div className="mb-4 border-b pb-4 flex justify-between items-center">
                                        <div>
                                            <h2 className="font-bold text-xl text-gray-800">Nhật ký Hôm nay</h2>
                                            <p className="text-gray-500 text-sm">Ghi chép giúp bạn nhìn nhận lại công việc.</p>
                                        </div>
                                        {/* Badge hiển thị Thứ */}
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg text-sm border border-gray-200">
                                            {['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][dayOfWeek]}
                                        </span>
                                    </div>

                                    <form onSubmit={handleSubmitNote} className="space-y-4">

                                        {/* LOGIC THỨ 2 */}
                                        {dayOfWeek === 1 && (
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                                                <h3 className="font-bold text-blue-800 mb-2">🎯 All Hands Meeting (Thứ 2)</h3>
                                                <label className="block text-sm font-semibold text-blue-700 mb-1">Ghi chú cuộc họp toàn công ty:</label>
                                                <textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none mb-3" rows={2} />

                                                {viewRole === 'depart' && (
                                                    <>
                                                        <label className="block text-sm font-semibold text-purple-700 mb-1">Kế hoạch dự kiến tuần này của phòng:</label>
                                                        <textarea value={plannedTasks} onChange={e => setPlannedTasks(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-400 outline-none" rows={3} placeholder="VD: Ra mắt tính năng A, chốt sale dự án B..." />
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Form chuẩn DSM */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">⭐ Highlight</label>
                                            <textarea
                                                value={highlight}
                                                onChange={e => { setHighlight(e.target.value); handleTextareaResize(e); }}
                                                required
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none resize-none overflow-hidden min-h-[80px]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">🚀 Follow-up</label>
                                            <textarea
                                                value={followUp}
                                                onChange={e => { setFollowUp(e.target.value); handleTextareaResize(e); }}
                                                required
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none resize-none overflow-hidden min-h-[80px]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">🚧 Blockers</label>
                                            <textarea
                                                value={blockers}
                                                onChange={e => { setBlockers(e.target.value); handleTextareaResize(e); }}
                                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none resize-none overflow-hidden min-h-[80px]"
                                            />
                                        </div>
                                        {viewRole === 'staff' && (
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">🌱 1% Better</label>
                                                <textarea
                                                    value={onePercentBetter}
                                                    onChange={e => { setOnePercentBetter(e.target.value); handleTextareaResize(e); }}
                                                    required
                                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none resize-none overflow-hidden min-h-[80px]"
                                                />
                                            </div>
                                        )}

                                        <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 shadow-md">
                                            {isSubmitting ? 'Đang gửi...' : 'Lưu Notes'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* NẾU LÀ NGÀY CŨ ĐÃ VIẾT -> HIỂN THỊ READ-ONLY */}
                            {viewingNote && (
                                <div className="bg-white rounded-xl shadow p-6 border-t-4 border-green-500">
                                    <div className="mb-4 border-b pb-4">
                                        <h2 className="font-bold text-xl text-green-800">Nhật ký ngày {selectedDate?.toLocaleDateString('vi-VN')}</h2>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        {/* Hiển thị meeting note nếu có */}
                                        {viewingNote.meeting_notes && (
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <p className="font-bold text-blue-800">🎯 Ghi chú All Hands:</p>
                                                <p className="text-blue-700">{viewingNote.meeting_notes}</p>
                                            </div>
                                        )}
                                        {viewingNote.planned_tasks && (
                                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                                <p className="font-bold text-purple-800">📋 Kế hoạch Tuần:</p>
                                                <p className="text-purple-700">{viewingNote.planned_tasks}</p>
                                            </div>
                                        )}
                                        <div className="p-3 bg-gray-50 rounded-lg border"><p className="font-bold text-gray-700">⭐ Highlight:</p><p>{viewingNote.highlight}</p></div>
                                        <div className="p-3 bg-gray-50 rounded-lg border"><p className="font-bold text-gray-700">🚀 Follow-up:</p><p>{viewingNote.follow_up}</p></div>
                                        <div className="p-3 bg-red-50 rounded-lg border border-red-100"><p className="font-bold text-red-700">🚧 Blockers:</p><p className="text-red-600">{viewingNote.blockers}</p></div>
                                    </div>
                                </div>
                            )}

                            {/* KHU VỰC AI DÀNH RIÊNG CHO THỨ 6 */}
                            {dayOfWeek === 5 && (selectedDate?.toDateString() === new Date().toDateString() || viewingNote) && (
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow p-6 border border-purple-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h2 className="font-bold text-xl text-purple-800 flex items-center">✨ AI Tổng Kết Báo Cáo Tuần</h2>
                                            <p className="text-purple-600 text-sm">Gemini sẽ phân tích toàn bộ nhật ký từ Thứ 2 đến nay.</p>
                                        </div>
                                        <button onClick={handleGenerateAIReport} disabled={isGeneratingAI} className="px-5 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-md disabled:bg-purple-400 flex items-center">
                                            {isGeneratingAI ? 'Đang phân tích...' : 'Khởi động AI'}
                                        </button>
                                    </div>

                                    {aiReport && (
                                        <div className="mt-4 p-5 bg-white rounded-lg border border-purple-100 text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {aiReport}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* MODAL CẢNH BÁO POPUP */}
                {showPopup && selectedDate && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
                            <div className="text-red-500 text-5xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Bạn đã bỏ lỡ!</h3>
                            <p className="text-gray-600 mb-6">Bạn đã không viết Total Daily Note vào {selectedDate.toLocaleDateString('vi-VN')}. Hãy thường xuyên viết báo cáo hơn nhé.</p>
                            <button onClick={() => { setShowPopup(false); setSelectedDate(new Date()); }} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">
                                Viết cho Hôm nay
                            </button>
                        </div>
                    </div>
                )}

                {/* MODAL CẬP NHẬT HỒ SƠ */}
                {showProfileModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                        {/* Modal code như bước trên đã làm... (Giữ nguyên) */}
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Tùy chỉnh Hồ Sơ</h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="flex justify-center mb-4">
                                    <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-blue-100 overflow-hidden flex items-center justify-center">
                                        {profileAvatar ? <img src={profileAvatar} className="w-full h-full object-cover" /> : <span className="text-gray-400 text-3xl">👤</span>}
                                    </div>
                                </div>
                                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Họ Tên</label><input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Ngày sinh</label><input type="date" value={profileDob} onChange={e => setProfileDob(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Link Ảnh (URL)</label><input type="url" value={profileAvatar} onChange={e => setProfileAvatar(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none" /></div>
                                <div className="flex space-x-3 pt-4">
                                    <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-2 bg-gray-100 font-bold rounded-xl hover:bg-gray-200">Hủy</button>
                                    <button type="submit" disabled={isUpdatingProfile} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-blue-300">Lưu</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}