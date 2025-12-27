'use client';

/**
 * Campus Virtual Navigation Bar
 *
 * Top navigation for students in the Campus Virtual.
 */

import Link from 'next/link';
import { useSession } from '../providers/SessionProvider';
import { BookOpen, GraduationCap, User, LogOut, Menu, Trophy } from 'lucide-react';
import { Button } from '@payload-config/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar';

export function CampusNavbar() {
  const { student, isAuthenticated, logout } = useSession();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between px-4">
        {/* Logo / Brand */}
        <Link href="/campus" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg hidden sm:inline">Campus Virtual</span>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/campus"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Mis Cursos
            </Link>
            <Link
              href="/campus/logros"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Trophy className="h-4 w-4" />
              Logros
            </Link>
          </div>
        )}

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {isAuthenticated && student ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.avatar} alt={student.fullName} />
                    <AvatarFallback>
                      {getInitials(student.firstName, student.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{student.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{student.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/campus/perfil" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus" className="cursor-pointer md:hidden">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Mis Cursos</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/logros" className="cursor-pointer md:hidden">
                    <Trophy className="mr-2 h-4 w-4" />
                    <span>Logros</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/campus/login">Iniciar Sesion</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
