'use client'

/**
 * Campus Virtual Navigation Bar
 *
 * Top navigation for students in the Campus Virtual.
 */

import Link from 'next/link'
import { useSession } from '../providers/SessionProvider'
import { BookOpen, GraduationCap, User, LogOut, Trophy } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'

export function CampusNavbar() {
  const { student, isAuthenticated, logout } = useSession()

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      data-oid="kiy15nb"
    >
      <nav className="container flex h-16 items-center justify-between px-4" data-oid="08qq4bt">
        {/* Logo / Brand */}
        <Link href="/campus" className="flex items-center gap-2" data-oid="4l8zn28">
          <GraduationCap className="h-6 w-6 text-primary" data-oid="x9ev5wh" />
          <span className="font-bold text-lg hidden sm:inline" data-oid="u8z-zjv">
            Campus Virtual
          </span>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-6" data-oid="zg3vrwz">
            <Link
              href="/campus"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              data-oid="che.2_a"
            >
              <BookOpen className="h-4 w-4" data-oid="n12hzl-" />
              Mis Cursos
            </Link>
            <Link
              href="/campus/logros"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              data-oid="7ro4je5"
            >
              <Trophy className="h-4 w-4" data-oid="2x1_yip" />
              Logros
            </Link>
          </div>
        )}

        {/* User Menu */}
        <div className="flex items-center gap-4" data-oid="t71k73m">
          {isAuthenticated && student ? (
            <DropdownMenu data-oid="8cgbeeo">
              <DropdownMenuTrigger asChild data-oid="8_2n58f">
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                  data-oid="-go2_me"
                >
                  <Avatar className="h-10 w-10" data-oid="34:9qk3">
                    <AvatarImage src={student.avatar} alt={student.fullName} data-oid="zdcfpx9" />
                    <AvatarFallback data-oid="djy0sxj">
                      {getInitials(student.firstName, student.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount data-oid="_5oqtvf">
                <DropdownMenuLabel className="font-normal" data-oid="e_u0ux7">
                  <div className="flex flex-col space-y-1" data-oid="heyxy29">
                    <p className="text-sm font-medium leading-none" data-oid="_:z4b13">
                      {student.fullName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground" data-oid="vom_o9k">
                      {student.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator data-oid="c24co:0" />
                <DropdownMenuItem asChild data-oid="emi_uak">
                  <Link href="/campus/perfil" className="cursor-pointer" data-oid="8qr908j">
                    <User className="mr-2 h-4 w-4" data-oid="bvz--z1" />
                    <span data-oid="xyfc3zz">Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild data-oid="bwyna6k">
                  <Link href="/campus" className="cursor-pointer md:hidden" data-oid="b49ngv2">
                    <BookOpen className="mr-2 h-4 w-4" data-oid="s67hd4t" />
                    <span data-oid="09y:pnx">Mis Cursos</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild data-oid="lz4ip:3">
                  <Link
                    href="/campus/logros"
                    className="cursor-pointer md:hidden"
                    data-oid="lkft48m"
                  >
                    <Trophy className="mr-2 h-4 w-4" data-oid="kio-sdq" />
                    <span data-oid="zmwhgsf">Logros</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator data-oid="5a0z7aa" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive"
                  data-oid="hnwmhd2"
                >
                  <LogOut className="mr-2 h-4 w-4" data-oid=".19qwxn" />
                  <span data-oid="2uaz-1u">Cerrar Sesion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" data-oid="24y6198">
              <Link href="/campus/login" data-oid="v8g8h99">
                Iniciar Sesion
              </Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}
