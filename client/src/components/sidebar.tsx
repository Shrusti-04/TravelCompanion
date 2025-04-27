import { useAuth } from "@/hooks/use-auth";
import { AvatarWithPresence } from "@/components/ui/avatar-with-presence";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { GlobeIcon, HomeIcon, CalendarIcon, PackageIcon, UsersIcon, SettingsIcon, LogOutIcon } from "lucide-react";

interface SidebarProps {
  onNavItemClick?: () => void;
}

export function Sidebar({ onNavItemClick }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: HomeIcon },
    { name: "My Trips", path: "/trips", icon: GlobeIcon },
    { name: "Schedule", path: "/schedule", icon: CalendarIcon },
    { name: "Packing List", path: "/packing", icon: PackageIcon },
    { name: "Shared Trips", path: "/shared", icon: UsersIcon },
    { name: "Settings", path: "/settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex h-full flex-col bg-white shadow-md border-r border-neutral-200">
      <div className="p-5 border-b border-neutral-200">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-xl font-bold text-neutral-800">TravelCloud</h1>
        </div>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.path}
              href={item.path} 
              onClick={onNavItemClick}
            >
              <a 
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-3 
                ${isActive(item.path) 
                  ? 'bg-primary-50 text-primary' 
                  : 'text-neutral-800 hover:bg-neutral-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      
      {user && (
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center space-x-3">
            <AvatarWithPresence
              name={user.name}
              status="online"
            />
            <div>
              <p className="text-sm font-medium text-neutral-800">{user.name}</p>
              <p className="text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="mt-3 w-full"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            <span>Log out</span>
          </Button>
        </div>
      )}
    </div>
  );
}
