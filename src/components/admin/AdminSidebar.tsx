import { useState } from "react";
import {
  Package, ShoppingBag, Tag, FolderOpen, Users, BarChart3,
  MessageSquare, Settings, FileText, Menu, BellRing, Activity,
  Shield, Bike, ChevronDown, ChevronRight, Database, Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: SidebarItem[];
  defaultOpen?: boolean;
}

const sidebarGroups: SidebarGroup[] = [
  {
    id: "overview",
    label: "Overview",
    icon: Gauge,
    defaultOpen: true,
    items: [
      { id: "dashboard", label: "Dashboard", icon: Gauge },
      { id: "orders", label: "Orders", icon: Package },
      { id: "statistics", label: "Statistics", icon: BarChart3 },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    icon: ShoppingBag,
    defaultOpen: true,
    items: [
      { id: "products", label: "Products", icon: ShoppingBag },
      { id: "categories", label: "Categories", icon: Tag },
      { id: "collections", label: "Collections", icon: FolderOpen },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: Bike,
    defaultOpen: false,
    items: [
      { id: "riders", label: "Riders", icon: Bike },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    defaultOpen: false,
    items: [
      { id: "user-profiles", label: "User Profiles", icon: Users },
      { id: "customer-list", label: "Order Customers", icon: Users },
      { id: "messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: FileText,
    defaultOpen: false,
    items: [
      { id: "site-settings", label: "Site Settings", icon: Settings },
      { id: "page-editor", label: "Page Editor", icon: FileText },
      { id: "menu-editor", label: "Menu Editor", icon: Menu },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: Settings,
    defaultOpen: false,
    items: [
      { id: "notifications", label: "Notifications", icon: BellRing },
      { id: "activity-logs", label: "Activity Logs", icon: Activity },
      { id: "backups", label: "Backups", icon: Database },
      { id: "security", label: "Security", icon: Shield },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  newOrderCount?: number;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Hide the collapse button (used inside the phone menu). */
  hideCollapseToggle?: boolean;
}

export const AdminSidebar = ({ 
  activeTab, 
  onTabChange, 
  newOrderCount = 0,
  collapsed = false,
  onCollapsedChange,
  hideCollapseToggle = false,
}: AdminSidebarProps) => {
  const [openGroups, setOpenGroups] = useState<string[]>(
    sidebarGroups.filter(g => g.defaultOpen).map(g => g.id)
  );

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };


  return (
    <div className={cn(
      "h-full w-full bg-card/95 backdrop-blur-sm border-r border-border/50 flex flex-col transition-all duration-300",
      collapsed ? "md:w-16" : "md:w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display text-lg text-foreground">Admin</span>
          </div>
        )}
        {!hideCollapseToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="h-10 w-10"
            aria-label={collapsed ? "Expand admin menu" : "Collapse admin menu"}
            aria-expanded={!collapsed}
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav aria-label="Admin sections" className="px-2 space-y-1">
          {collapsed ? (
            <TooltipProvider delayDuration={150}>
              {sidebarGroups.map((group) => (
                <div key={group.id} className="space-y-1 pb-2 border-b border-border/30 last:border-0">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const showBadge = item.id === "orders" && newOrderCount > 0;
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onTabChange(item.id)}
                            aria-label={showBadge ? `${item.label} (${newOrderCount} new)` : item.label}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "relative w-full h-10",
                              isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <item.icon className="w-4 h-4" />
                            {showBadge && <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-destructive" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </TooltipProvider>
          ) : sidebarGroups.map((group) => (
            <Collapsible
              key={group.id}
              open={openGroups.includes(group.id)}
              onOpenChange={() => toggleGroup(group.id)}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 px-3 py-2 h-10">
                  <group.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left text-sm font-medium text-muted-foreground">{group.label}</span>
                  {openGroups.includes(group.id) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-0.5 mt-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const showBadge = item.id === "orders" && newOrderCount > 0;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => onTabChange(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "w-[calc(100%-1rem)] justify-start gap-2 h-10 px-3 ml-4",
                        isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                      {showBadge && (
                        <Badge className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0">
                          {newOrderCount}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Chitraboli Admin v2.0
          </p>
        </div>
      )}
    </div>
  );
};
