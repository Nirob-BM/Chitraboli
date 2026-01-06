import { Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ShopFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortOption: string;
  onSortChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: { name: string; count: number }[];
}

export const ShopFilters = ({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  selectedCategory,
  onCategoryChange,
  categories,
}: ShopFiltersProps) => {
  return (
    <div className="space-y-6 mb-12">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-border/50 focus:border-primary"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortOption} onValueChange={onSortChange}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card border-border/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name-az">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => onCategoryChange("All")}
          className={cn(
            "px-6 py-2 rounded-full font-body text-sm transition-all duration-300",
            selectedCategory === "All"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => onCategoryChange(category.name)}
            className={cn(
              "px-6 py-2 rounded-full font-body text-sm transition-all duration-300",
              selectedCategory === category.name
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>
    </div>
  );
};
