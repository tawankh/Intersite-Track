import React, { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, Users, ClipboardList, Bell, BarChart3, Database } from "lucide-react";
import { AnimatePresence } from "motion/react";

import { supabase } from "./lib/supabase";
import { authService } from "./services/authService";
import { taskService } from "./services/taskService";
import { userService } from "./services/userService";
import { notificationService } from "./services/notificationService";

import { LoginPage } from "./components/auth/LoginPage";
import { ProfileModal } from "./components/auth/ProfileModal";
import { MainLayout } from "./components/layout/MainLayout";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { TasksPage } from "./components/tasks/TasksPage";
import { TaskFormModal } from "./components/tasks/TaskFormModal";
import { TaskDetailModal } from "./components/tasks/TaskDetailModal";
import { StaffPage } from "./components/staff/StaffPage";
import { UserFormModal } from "./components/staff/UserFormModal";
import { ReportsPage } from "./components/reports/ReportsPage";
import { NotificationsPage } from "./components/notifications/NotificationsPage";
import { SettingsPage } from "./components/settings/SettingsPage";
import { ConfirmDialog } from "./components/common/ConfirmDialog";

import type { User, Task, Department, TaskType, Notification, Stats } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const triggerRefresh = useCallback(() => setRefreshTrigger((prev) => prev + 1), []);

  useEffect(() => {
    // Restore user from localStorage first (faster, no DB access)
    const saved = authService.getStoredUser();
    if (saved) setUser(saved);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          const profile = await authService.fetchProfile();
          setUser(profile);
        } catch {
          // Profile fetch failed — user may not exist in app DB yet
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setActiveTab("dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [n, c] = await Promise.all([
        notificationService.getNotifications(user.id),
        notificationService.getUnreadCount(user.id),
      ]);
      setNotifications(n); setUnreadCount(c.count);
    } catch {}
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications, activeTab, refreshTrigger]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const handleLogin = (loggedInUser: User) => setUser(loggedInUser);

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
    setActiveTab("dashboard");
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const tabs = [
    { key: "dashboard", label: "แดชบอร์ด", icon: <LayoutDashboard size={20} /> },
    { key: "tasks", label: "จัดการงาน", icon: <ClipboardList size={20} /> },
    ...(user.role === "admin" ? [{ key: "staff", label: "เจ้าหน้าที่", icon: <Users size={20} /> }] : []),
    { key: "reports", label: "รายงาน", icon: <BarChart3 size={20} /> },
    { key: "notifications", label: "การแจ้งเตือน", icon: <Bell size={20} /> },
    ...(user.role === "admin" ? [{ key: "settings", label: "ข้อมูลพื้นฐาน", icon: <Database size={20} /> }] : []),
  ];

  const tabTitles: Record<string, string> = {
    dashboard: "แดชบอร์ด", tasks: "จัดการงาน", staff: "จัดการเจ้าหน้าที่",
    reports: "รายงาน", notifications: "การแจ้งเตือน", settings: "ข้อมูลพื้นฐาน",
  };

  return (
    <>
      <MainLayout
        user={user} activeTab={activeTab} tabs={tabs} tabTitles={tabTitles}
        unreadCount={unreadCount} onTabChange={setActiveTab} onLogout={handleLogout}
        onProfileClick={() => setProfileOpen(true)}
        onNotificationClick={() => { setActiveTab("notifications"); fetchNotifications(); }}
        onCreateTask={() => { setEditingTask(null); setTaskFormOpen(true); }}
        onCreateUser={() => { setEditingUser(null); setUserFormOpen(true); }}
      >
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <React.Fragment key="dashboard">
              <DashboardPage user={user}
                onViewTask={setSelectedTask} onViewAll={() => setActiveTab("tasks")} refreshTrigger={refreshTrigger} />
            </React.Fragment>
          )}
          {activeTab === "tasks" && (
            <React.Fragment key="tasks">
              <TasksPage currentUser={user} refreshTrigger={refreshTrigger}
                onViewTask={setSelectedTask} onEditTask={(t) => { setEditingTask(t); setTaskFormOpen(true); }} />
            </React.Fragment>
          )}
          {activeTab === "staff" && (
            <React.Fragment key="staff">
              <StaffPage refreshTrigger={refreshTrigger} onEdit={(u) => { setEditingUser(u); setUserFormOpen(true); }}
                onDelete={(uid) => setConfirmDialog({ message: "ต้องการลบเจ้าหน้าที่นี้?", onConfirm: async () => { await userService.deleteUser(uid); triggerRefresh(); setConfirmDialog(null); } })} />
            </React.Fragment>
          )}
          {activeTab === "reports" && <React.Fragment key="reports"><ReportsPage refreshTrigger={refreshTrigger} /></React.Fragment>}
          {activeTab === "notifications" && (
            <React.Fragment key="notifications">
              <NotificationsPage notifications={notifications}
                onMarkRead={async (id) => { await notificationService.markRead(id); fetchNotifications(); }}
                onMarkAllRead={async () => { await notificationService.markAllRead(user.id); fetchNotifications(); }}
                onViewTask={async (refId) => { const t = await taskService.getTask(refId); setSelectedTask(t); }} />
            </React.Fragment>
          )}
          {activeTab === "settings" && (
            <React.Fragment key="settings">
              <SettingsPage refreshTrigger={refreshTrigger} />
            </React.Fragment>
          )}
        </AnimatePresence>
      </MainLayout>

      {taskFormOpen && (
        <TaskFormModal task={editingTask} currentUser={user}
          onClose={() => { setTaskFormOpen(false); setEditingTask(null); }}
          onSave={() => { setTaskFormOpen(false); setEditingTask(null); triggerRefresh(); }} />
      )}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} user={user}
          onClose={() => setSelectedTask(null)}
          onUpdate={async () => { triggerRefresh(); fetchNotifications(); try { const t = await taskService.getTask(selectedTask.id); setSelectedTask(t); } catch {} }}
          onEdit={(t) => { setSelectedTask(null); setEditingTask(t); setTaskFormOpen(true); }} />
      )}
      {userFormOpen && (
        <UserFormModal user={editingUser}
          onClose={() => { setUserFormOpen(false); setEditingUser(null); }}
          onSave={() => { setUserFormOpen(false); setEditingUser(null); triggerRefresh(); }} />
      )}
      {profileOpen && (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)}
          onSave={(updated) => { setUser(updated); localStorage.setItem("user", JSON.stringify(updated)); setProfileOpen(false); triggerRefresh(); }} />
      )}
      {confirmDialog && (
        <ConfirmDialog message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} />
      )}
    </>
  );
}
