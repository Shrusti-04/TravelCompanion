import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarWithPresence } from "@/components/ui/avatar-with-presence";
import { MobileSidebar } from "@/components/ui/mobile-sidebar";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  onSearch?: (searchTerm: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm z-10">
      <div className="flex justify-between items-center px-4 py-4 sm:px-6">
        <div className="flex items-center md:hidden">
          <MobileSidebar />
          <h1 className="ml-3 text-lg font-bold text-neutral-800 md:hidden">TravelCloud</h1>
        </div>
        
        <div className="hidden md:flex md:flex-1 md:justify-center px-2 lg:px-0">
          <div className="relative max-w-lg w-full lg:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <Input 
              className="pl-10 pr-3" 
              placeholder="Search trips, destinations..." 
              type="search"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-6 w-6 text-neutral-500" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-orange-500"></span>
            <span className="sr-only">Notifications</span>
          </Button>
          
          <div className="md:hidden">
            {user && (
              <AvatarWithPresence
                name={user.name}
                size="sm"
                status="online"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
