import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface NavItemBase {
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

export type NavItem = NavItemBase & (
  | { path: string; children?: never }
  | { path?: never; children: NavItem[] }
);

export interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  navSections: NavSection[];
  onNavigate?: () => void;
  isExpanded?: boolean;
  setIsExpanded?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ navSections, onNavigate, isExpanded = true, setIsExpanded }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const activeParents: Record<string, boolean> = {};
    const collectActiveParents = (items: NavItem[], ancestors: string[] = []) => {
      for (const item of items) {
        const pathMatches = item.path && (
          location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(`${item.path}/`))
        );
        const nextAncestors = item.children?.length ? [...ancestors, item.label] : ancestors;
        if (pathMatches) {
          for (const ancestor of ancestors) activeParents[ancestor] = true;
        }
        if (item.children) collectActiveParents(item.children, nextAncestors);
      }
    };

    navSections.forEach((section) => collectActiveParents(section.items));
    setOpenItems(activeParents);
  }, [location.pathname, navSections]);

  const isPathActive = (path?: string) => Boolean(path && (
    location.pathname === path
  ));

  const itemHasActiveChild = (item: NavItem): boolean =>
    Boolean(item.children?.some((child) => isPathActive(child.path) || itemHasActiveChild(child)));

  const renderItems = (items: NavItem[], depth = 0, visible = true): React.ReactNode => items.map((item) => {
    const key = item.path || item.label;
    const hasChildren = Boolean(item.children?.length);
    const expanded = Boolean(openItems[key]);
    const active = isPathActive(item.path);
    const activeWithin = active || itemHasActiveChild(item);
    const indent = depth > 0 ? { paddingLeft: `${8 + depth * 14}px` } : undefined;

    return (
      <div key={key}>
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={expanded}
            tabIndex={visible ? undefined : -1}
            onClick={() => {
              if (!isExpanded && setIsExpanded) setIsExpanded(true);
              setOpenItems((current) => {
                const next = { ...current };
                items.forEach((sibling) => {
                  if (sibling.children?.length) next[sibling.path || sibling.label] = false;
                });
                next[key] = !current[key];
                return next;
              });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors duration-200"
            style={{
              ...indent,
              color: activeWithin ? 'var(--green)' : 'var(--text2)',
              backgroundColor: activeWithin ? 'var(--surface2)' : 'transparent',
            }}
          >
            <span className="flex flex-shrink-0 items-center justify-center text-[16px]">
              {item.icon}
            </span>
            {isExpanded && (
              <>
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-danger-contrast">
                    {item.badge}
                  </span>
                ) : null}
                {expanded
                  ? <ChevronDown size={14} className="flex-shrink-0 transition-transform duration-200" />
                  : <ChevronRight size={14} className="flex-shrink-0 transition-transform duration-200" />}
              </>
            )}
          </button>
        ) : item.path ? (
          <Link
            to={item.path}
            title={isExpanded ? undefined : item.label}
            tabIndex={visible ? undefined : -1}
            onClick={() => onNavigate?.()}
            className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200"
            style={{
              ...indent,
              color: active ? 'var(--green)' : 'var(--text2)',
              backgroundColor: active ? 'var(--surface2)' : 'transparent',
            }}
          >
            <span className="flex flex-shrink-0 items-center justify-center text-[16px]">{item.icon}</span>
            {isExpanded && (
              <>
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-danger-contrast">
                    {item.badge}
                  </span>
                ) : null}
              </>
            )}
          </Link>
        ) : null}
        {hasChildren && isExpanded && (
          <div
            aria-hidden={!expanded}
            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
              expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="mt-1 space-y-1 border-l py-1" style={{ borderColor: 'var(--border)' }}>
                {renderItems(item.children || [], depth + 1, visible && expanded)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });

  return (
    <div
      ref={sidebarRef}
      className={`w-full h-full flex flex-col border-r overflow-y-auto relative`}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {setIsExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute right-2 top-2 z-10 rounded p-1.5 text-sm font-bold transition-colors hover:bg-opacity-50"
          style={{ color: 'var(--text2)', backgroundColor: 'transparent' }}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      )}

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={idx} className={isExpanded ? 'px-3 py-4' : 'px-2 py-4'}>
            {isExpanded && (
              <div
                className="text-[10px] font-mono uppercase tracking-widest mb-2 px-1"
                style={{ color: 'var(--text3)' }}
              >
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {renderItems(section.items)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
