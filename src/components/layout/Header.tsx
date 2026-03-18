import { Bell, Plus, Sun, Moon, Menu } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "../../contexts/ThemeContext";
import { features } from "../../config/features";
import type { User } from "../../types";

interface HeaderProps {
  title: string;
  user: User;
  activeTab: string;
  unreadCount: number;
  onNotificationClick: () => void;
  onMenuToggle: () => void;
  onCreateTask?: () => void;
  onCreateUser?: () => void;
}

export function Header({
  title,
  user,
  activeTab,
  unreadCount,
  onNotificationClick,
  onMenuToggle,
  onCreateTask,
  onCreateUser,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 md:h-16 bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 md:px-8 shrink-0 transition-colors duration-300 relative z-10 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors shrink-0"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-lg md:text-xl font-serif font-bold text-[#1a1a1a] dark:text-white transition-colors duration-300 truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {features.premiumTheme.enabled && (
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.15, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
        )}

        <motion.button
          onClick={onNotificationClick}
          animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.6, ease: "easeInOut", repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
            >
              {unreadCount}
            </motion.span>
          )}
        </motion.button>

        {user.role === "admin" && activeTab === "tasks" && onCreateTask && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateTask}
            className="bg-[#5A5A40] text-white px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">สร้างงานใหม่</span>
          </motion.button>
        )}

        {user.role === "admin" && activeTab === "staff" && onCreateUser && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateUser}
            className="bg-[#5A5A40] text-white px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">เพิ่มเจ้าหน้าที่</span>
          </motion.button>
        )}
      </div>
    </header>
  );
}
