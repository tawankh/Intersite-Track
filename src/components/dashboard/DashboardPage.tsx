import { useState, useEffect } from "react";
import { ClipboardList, Clock, AlertCircle, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { StatCard } from "../common/StatCard";
import { UpcomingTasks } from "./UpcomingTasks";
import { DashboardSkeleton } from "../common/Skeleton";
import { taskService } from "../../services/taskService";
import { userService } from "../../services/userService";
import { formatDate } from "../../utils/formatters";
import { priorityLabel, priorityColor } from "../../utils/constants";
import type { Task, User, Stats } from "../../types";

interface DashboardPageProps {
  user: User;
  onViewTask: (task: Task) => void;
  onViewAll: () => void;
  refreshTrigger?: number;
}

export function DashboardPage({ user, onViewTask, onViewAll, refreshTrigger }: DashboardPageProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, inProgress: 0, pending: 0, cancelled: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [s, t, u] = await Promise.all([
          taskService.getStats(),
          taskService.getTasks(),
          user.role === "admin" ? userService.getUsers() : Promise.resolve([])
        ]);
        if (mounted) {
          setStats(s);
          setTasks(t);
          setUsers(u);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [user.role, refreshTrigger]);

  if (loading) return <DashboardSkeleton />;

  const myTasks =
    user.role === "staff"
      ? tasks.filter((t) => t.assignments.some((a) => a.id === user.id))
      : tasks;

  const today = new Date().toISOString().split("T")[0];
  const activeTasks = myTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const overdueTasks = activeTasks.filter((t) => t.due_date && t.due_date < today);
  const dueTodayTasks = activeTasks.filter((t) => t.due_date === today);
  const completionRate = myTasks.length > 0 ? Math.round((myTasks.filter((t) => t.status === "completed").length / myTasks.length) * 100) : 0;
  const focusCards = [
    { label: user.role === "admin" ? "งานที่เปิดอยู่" : "งานของฉัน", value: activeTasks.length, tone: "text-[#5A5A40]" },
    { label: "เลยกำหนด", value: overdueTasks.length, tone: "text-rose-600" },
    { label: "ครบกำหนดวันนี้", value: dueTodayTasks.length, tone: "text-amber-600" },
    { label: "ปิดงานสำเร็จ", value: `${completionRate}%`, tone: "text-emerald-600" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard index={0} title="งานทั้งหมด" value={stats.total} icon={<ClipboardList className="text-blue-500" />} bg="bg-blue-50" />
        <StatCard index={1} title="กำลังดำเนินการ" value={stats.inProgress} icon={<Clock className="text-amber-500" />} bg="bg-amber-50" />
        <StatCard index={2} title="รอดำเนินการ" value={stats.pending} icon={<AlertCircle className="text-orange-500" />} bg="bg-orange-50" />
        <StatCard index={3} title="เสร็จสิ้น" value={stats.completed} icon={<CheckCircle2 className="text-emerald-500" />} bg="bg-emerald-50" />
        <StatCard index={4} title="ยกเลิก" value={stats.cancelled} icon={<XCircle className="text-rose-500" />} bg="bg-rose-50" />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {focusCards.map((card) => (
          <div key={card.label} className="app-surface-subtle rounded-2xl px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] app-soft mb-2">{card.label}</p>
            <p className={`text-2xl font-serif font-bold ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 app-surface rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-serif font-bold app-heading">งานล่าสุด</h3>
            <button onClick={onViewAll} className="text-sm text-[#5A5A40] font-medium hover:underline">
              ดูทั้งหมด
            </button>
          </div>
          <div className="space-y-3">
            {myTasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                onClick={() => onViewTask(task)}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-[var(--app-surface-muted)] transition-colors border border-transparent hover:border-gray-100 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      task.status === "completed"
                        ? "bg-emerald-100 text-emerald-600"
                        : task.status === "in_progress"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {task.status === "completed" ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <p className="font-medium app-heading text-sm">{task.title}</p>
                    <p className="text-xs app-muted">กำหนดส่ง: {formatDate(task.due_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${priorityColor[task.priority]}`}>
                    {priorityLabel[task.priority]}
                  </span>
                  <ChevronRight size={18} className="app-soft group-hover:text-[#5A5A40]" />
                </div>
              </div>
            ))}
            {myTasks.length === 0 && (
              <p className="text-center app-soft py-8">ยังไม่มีงาน</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <UpcomingTasks tasks={myTasks} onViewTask={onViewTask} />

          {user.role === "admin" && (
            <div className="app-surface rounded-3xl p-6">
              <h3 className="text-lg font-serif font-bold app-heading mb-4">เจ้าหน้าที่</h3>
              <div className="space-y-4">
                {users
                  .filter((u) => u.role === "staff")
                  .slice(0, 5)
                  .map((u) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F5F5F0] flex items-center justify-center text-[#5A5A40] font-bold text-sm">
                        {u.first_name[0]}{u.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium app-heading truncate">{u.first_name} {u.last_name}</p>
                        <p className="text-xs app-soft">{u.position}</p>
                      </div>
                      <span className="text-xs font-medium text-[#5A5A40] bg-[#F5F5F0] px-2 py-1 rounded-lg">
                        {u.department_name}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
