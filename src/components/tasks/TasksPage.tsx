import { useState, useEffect } from "react";
import { ClipboardList, LayoutGrid, List } from "lucide-react";
import { motion } from "motion/react";
import { TaskCard } from "./TaskCard";
import { KanbanBoard } from "./KanbanBoard";
import { TaskFilters, type FilterValues } from "./TaskFilters";
import { TasksSkeleton } from "../common/Skeleton";
import { features } from "../../config/features";
import { taskService } from "../../services/taskService";
import { userService } from "../../services/userService";
import { taskTypeService } from "../../services/taskTypeService";
import type { Task, User, TaskType } from "../../types";

interface TasksPageProps {
  currentUser: User;
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  refreshTrigger?: number; // Used by App to trigger refresh after creating a task
}

export function TasksPage({ currentUser, onViewTask, onEditTask, refreshTrigger = 0 }: TasksPageProps) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  const [filters, setFilters] = useState<FilterValues>({
    search: "", status: "", priority: "", assignee: "", dateFrom: "", dateTo: "",
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [t, u, tt] = await Promise.all([
        taskService.getTasks(),
        userService.getUsers(),
        taskTypeService.getTaskTypes()
      ]);
      setTasks(t);
      setUsers(u);
      setTaskTypes(tt);
    } catch (error) {
      console.error("Failed to load tasks workspace data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [refreshTrigger]);

  if (loading) return <TasksSkeleton />;

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    // Optimistic Update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));

    try {
      await taskService.updateStatus(taskId, newStatus as any);
    } catch (error) {
      console.error("Failed to update task status", error);
      // Rollback on failure
      setTasks(previousTasks);
      alert("ไม่สามารถเปลี่ยนสถานะได้ (ท่านไม่มีสิทธิ์หรือระบบขัดข้อง)");
    }
  };

  const myTasks =
    currentUser.role === "staff"
      ? tasks.filter((t) => t.assignments.some((a) => a.id === currentUser.id))
      : tasks;

  const filtered = myTasks.filter((t) => {
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase()) && !(t.description || "").toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assignee && !t.assignments.some((a) => a.id === Number(filters.assignee))) return false;
    if (filters.dateFrom && t.due_date < filters.dateFrom) return false;
    if (filters.dateTo && t.due_date > filters.dateTo) return false;
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <TaskFilters users={users} onFilterChange={setFilters} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          แสดง {filtered.length} จาก {myTasks.length} งาน
        </p>
        
        {features.kanbanBoard.enabled && (
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-black/5 dark:border-white/5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[#5A5A40] text-white shadow" : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
              title="แบบรายการ"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "board" ? "bg-[#5A5A40] text-white shadow" : "text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}
              title="แบบบอร์ด"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        )}
      </div>

      {viewMode === "board" && features.kanbanBoard.enabled ? (
        <KanbanBoard
          tasks={filtered}
          currentUser={currentUser}
          onViewTask={onViewTask}
          onEditTask={onEditTask}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onView={() => onViewTask(task)}
              onEdit={currentUser.role === "admin" ? () => onEditTask(task) : undefined}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
          <p>ไม่พบงานที่ตรงตามเงื่อนไข</p>
        </div>
      )}
    </motion.div>
  );
}
