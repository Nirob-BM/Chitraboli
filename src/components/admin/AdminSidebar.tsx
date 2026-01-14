import { useState } from "react";
import { useLocation } from "react-router-dom";
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
}

export const AdminSidebar = ({ 
  activeTab, 
  onTabChange, 
  newOrderCount = 0,
  collapsed = false,
  onCollapsedChange
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

  const handleItemClick = (itemId: string) => {
    onTabChange(itemId);
  };

  // Map customer-list to customers for backwards compatibility
  const normalizedActiveTab = activeTab === "customer-list" ? "customer-list" : activeTab;

  return (
    <div className={cn(
      "h-full bg-card/95 backdrop-blur-sm border-r border-border/50 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapsedChange?.(!collapsed)}
          className="h-8 w-8 p-0"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <div className="px-2 space-y-1">
          {sidebarGroups.map((group) => (
            <Collapsible 
              key={group.id}
              open={!collapsed && openGroups.includes(group.id)}
              onOpenChange={() => !collapsed && toggleGroup(group.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 px-3 py-2 h-auto",
                    collapsed ? "justify-center px-2" : ""
                  )}
                >
                  <group.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium text-muted-foreground">
                        {group.label}
                      </span>
                      {openGroups.includes(group.id) ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-0.5 mt-1">
                {group.items.map((item) => {
                  const isActive = normalizedActiveTab === item.id;
                  const showBadge = item.id === "orders" && newOrderCount > 0;
                  
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => handleItemClick(item.id)}
                      className={cn(
                        "w-full justify-start gap-2 h-9 px-3",
                        collapsed ? "justify-center px-2 ml-0" : "ml-4",
                        isActive 
                          ? "bg-primary/10 text-primary hover:bg-primary/20" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left text-sm">{item.label}</span>
                          {showBadge && (
                            <Badge className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0">
                              {newOrderCount}
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
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
