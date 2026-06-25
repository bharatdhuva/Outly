import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  Mail,
  FileText,
  BarChart,
  Edit,
  UserCheck,
  Settings,
  ScrollText,
  Send,
  Twitter,
  LayoutGrid,
  TrendingUp,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";

interface SearchItem {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  keywords: string[];
  category: "workspace" | "publishing" | "admin";
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    title: "Overview",
    description: "Dashboard overview & stats",
    path: "/",
    icon: LayoutDashboard,
    keywords: ["home", "dashboard", "overview", "stats", "summary", "main", "launch"],
    category: "workspace",
  },
  {
    title: "Cold Mail",
    description: "Manage cold email campaigns",
    path: "/cold-mail",
    icon: Mail,
    keywords: ["cold", "mail", "email", "outreach", "campaign", "send", "hr", "companies"],
    category: "workspace",
  },
  {
    title: "Applications",
    description: "Track job applications",
    path: "/applications",
    icon: LayoutGrid,
    keywords: ["applications", "tracker", "jobs", "applied", "interview", "offer", "rejected", "saved", "kanban", "pipeline"],
    category: "workspace",
  },
  {
    title: "ATS Score",
    description: "Check resume ATS compatibility",
    path: "/ats-score",
    icon: BarChart,
    keywords: ["ats", "score", "resume", "compatibility", "keywords", "check", "match"],
    category: "workspace",
  },
  {
    title: "Resume Tailor",
    description: "Tailor resume for job descriptions",
    path: "/resume-tailor",
    icon: FileText,
    keywords: ["resume", "tailor", "customize", "job", "description", "jd", "cv"],
    category: "workspace",
  },

  {
    title: "LinkedIn Posts",
    description: "Create & manage LinkedIn posts",
    path: "/linkedin-posts",
    icon: FileText,
    keywords: ["linkedin", "posts", "content", "publish", "draft", "social"],
    category: "publishing",
  },
  {
    title: "Twitter / X",
    description: "Manage tweets and threads",
    path: "/twitter",
    icon: Twitter,
    keywords: ["twitter", "x", "tweet", "thread", "post", "social"],
    category: "publishing",
  },
  {
    title: "Analytics",
    description: "View email & outreach analytics",
    path: "/analytics",
    icon: TrendingUp,
    keywords: ["analytics", "data", "charts", "metrics", "reply", "rate", "performance"],
    category: "admin",
  },
  {
    title: "Settings",
    description: "Configure Outly preferences",
    path: "/settings",
    icon: Settings,
    keywords: ["settings", "config", "preferences", "setup", "api", "keys", "name", "email"],
    category: "admin",
  },
  {
    title: "Logs",
    description: "View system activity logs",
    path: "/logs",
    icon: ScrollText,
    keywords: ["logs", "activity", "history", "debug", "errors", "system"],
    category: "admin",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  workspace: "Workspace",
  publishing: "Publishing",
  admin: "Admin",
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter items based on query
  const filteredItems = query.trim()
    ? SEARCH_ITEMS.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.keywords.some((kw) => kw.includes(q))
        );
      })
    : SEARCH_ITEMS;

  // Group items by category
  const groupedItems: { category: string; items: SearchItem[] }[] = [];
  const categoryOrder = ["workspace", "publishing", "admin"];
  for (const cat of categoryOrder) {
    const items = filteredItems.filter((item) => item.category === cat);
    if (items.length > 0) {
      groupedItems.push({ category: cat, items });
    }
  }

  // Flat list for keyboard navigation
  const flatItems = groupedItems.flatMap((g) => g.items);

  const showDropdown = isFocused && flatItems.length > 0;

  const handleSelect = useCallback(
    (item: SearchItem) => {
      navigate(item.path);
      setQuery("");
      setIsFocused(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    },
    [navigate]
  );

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatItems.length) {
          handleSelect(flatItems[activeIndex]);
        } else if (flatItems.length > 0) {
          handleSelect(flatItems[0]);
        }
        break;
      case "Escape":
        setIsFocused(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  return (
    <div ref={containerRef} className="search-bar-container">
      {/* Input field */}
      <div
        className={`search-bar-input-wrapper ${isFocused ? "search-bar-input-wrapper--focused" : ""}`}
      >
        <Search className="search-bar-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search pages, workflows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="search-bar-input"
          autoComplete="off"
          spellCheck={false}
        />
        {!isFocused && (
          <kbd className="search-bar-kbd">
            Ctrl K
          </kbd>
        )}
        {query && isFocused && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="search-bar-clear"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && (
        <div ref={listRef} className="search-bar-dropdown">
          {groupedItems.map((group) => {
            const groupStartIndex = flatItems.indexOf(group.items[0]);
            return (
              <div key={group.category} className="search-bar-group">
                <div className="search-bar-group-label">
                  {CATEGORY_LABELS[group.category]}
                </div>
                {group.items.map((item, idx) => {
                  const flatIdx = groupStartIndex + idx;
                  const isActive = flatIdx === activeIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      data-index={flatIdx}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(flatIdx)}
                      className={`search-bar-item ${isActive ? "search-bar-item--active" : ""}`}
                    >
                      <div className="search-bar-item-icon">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="search-bar-item-text">
                        <span className="search-bar-item-title">{item.title}</span>
                        <span className="search-bar-item-desc">{item.description}</span>
                      </div>
                      {isActive && (
                        <div className="search-bar-item-action">
                          <CornerDownLeft className="h-3 w-3" />
                        </div>
                      )}
                      {!isActive && (
                        <ArrowRight className="search-bar-item-arrow" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {query.trim() && flatItems.length === 0 && (
            <div className="search-bar-empty">
              No results for "{query}"
            </div>
          )}
          <div className="search-bar-footer">
            <span><kbd className="search-bar-footer-kbd">↑↓</kbd> Navigate</span>
            <span><kbd className="search-bar-footer-kbd">↵</kbd> Select</span>
            <span><kbd className="search-bar-footer-kbd">Esc</kbd> Close</span>
          </div>
        </div>
      )}
    </div>
  );
}
