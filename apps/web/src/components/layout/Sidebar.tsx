import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
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
  const isOpen = isExpanded;
  const setIsOpen = setIsExpanded || (() => {});
  const sidebarRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={sidebarRef}
      className={`w-full h-full flex flex-col border-r overflow-y-auto relative`}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Collapse/Expand Button - Top Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-2 right-2 p-1.5 rounded transition-colors text-sm font-bold hover:bg-opacity-50 z-10"
        style={{ 
          color: 'var(--text2)',
          backgroundColor: 'transparent'
        }}
        title={isOpen ? 'collapse' : 'expand'}
      >
        {isOpen ? '«' : '»'}
      </button>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={idx} className={isOpen ? 'px-3 py-4' : 'px-2 py-4'}>
            {isOpen && (
              <div
                className="text-[10px] font-mono uppercase tracking-widest mb-2 px-1"
                style={{ color: 'var(--text3)' }}
              >
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path !== '/'}
                  title={isOpen ? '' : item.label}
                  onClick={() => onNavigate?.()}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg transition-all"
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--green)' : 'var(--text2)',
                    backgroundColor: isActive ? 'var(--surface2)' : 'transparent'
                  })}
                >
                  <span className="text-[16px] flex-shrink-0">{item.icon}</span>
                  {isOpen && (
                    <>
                      <span className="text-[12px] font-medium flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
