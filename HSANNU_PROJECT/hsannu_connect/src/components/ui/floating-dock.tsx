import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse, IconLogout, IconNotification, IconUserCircle } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { deleteCookie } from "cookies-next";
import Image from "next/image";
import { getCachedAvatarDataUrl, cacheAvatarDataUrl } from "@/lib/avatar-cache";

export type FloatingDockItem =
  | { type?: "item"; title: string; icon: React.ReactNode; href: string }
  | { type: "separator" }
  | { type: "profile"; user: { name: string; email?: string; avatar: string } };

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

function ProfileMenu({ user }: { user: { name: string; email?: string; avatar: string } }) {
  const router = useRouter();

  const initials = (user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleAccountClick = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("account", "true");
    router.push(currentUrl.pathname + currentUrl.search);
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("user");
    deleteCookie("userId");
    deleteCookie("userRole");
    router.push("/login");
  };

  const [avatarErrored, setAvatarErrored] = useState(false);
  const [displayAvatar, setDisplayAvatar] = useState<string>(() => user.avatar);

  useEffect(() => {
    let cancelled = false;
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return;
      const parsed = JSON.parse(stored) as { id?: string | number };
      const uid = parsed?.id ? String(parsed.id) : '';
      if (!uid) return;
      const cached = getCachedAvatarDataUrl(uid);
      if (cached && !cancelled) setDisplayAvatar(cached);
      cacheAvatarDataUrl(uid, user.avatar).then(() => {
        if (cancelled) return;
        const fresh = getCachedAvatarDataUrl(uid);
        if (fresh) setDisplayAvatar(prev => (prev !== fresh ? fresh : prev));
      });
    } catch {
      // ignore
    }
    return () => { cancelled = true };
  }, [user.avatar]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 p-0 dark:bg-neutral-800">
          {avatarErrored || !displayAvatar ? (
            <div className="h-5 w-5 rounded-full bg-neutral-400 text-white text-[10px] flex items-center justify-center">
              {initials}
            </div>
          ) : (
            <Image
              src={displayAvatar}
              alt={user.name}
              width={20}
              height={20}
              className="h-5 w-5 rounded-full object-cover"
              onError={() => setAvatarErrored(true)}
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-lg" side="top" align="end" sideOffset={8}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={displayAvatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              {user.email ? (
                <span className="text-muted-foreground truncate text-xs">{user.email}</span>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleAccountClick} className="cursor-pointer">
            <IconUserCircle />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconNotification />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <IconLogout />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {items.map((item, idx) => {
              if ("type" in item && item.type === "separator") {
                return (
                  <div
                    key={`sep-${idx}`}
                    className="h-px w-full bg-gray-200 dark:bg-neutral-800"
                  />
                );
              }
              if ("type" in item && item.type === "profile") {
                const it = item as Extract<FloatingDockItem, { type: "profile" }>;
                return (
                  <motion.div
                    key={`profile-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10, transition: { delay: idx * 0.05 } }}
                    transition={{ delay: (items.length - 1 - idx) * 0.05 }}
                    className="px-0"
                  >
                    <ProfileMenu user={it.user} />
                  </motion.div>
                );
              }
              const it = item as Exclude<FloatingDockItem, { type: "separator" | "profile" }>;
              return (
                <motion.div
                  key={it.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    transition: {
                      delay: idx * 0.05,
                    },
                  }}
                  transition={{ delay: (items.length - 1 - idx) * 0.05 }}
                >
                  <Link
                    href={it.href}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900"
                  >
                    <div className="h-4 w-4">{it.icon}</div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800"
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-16 items-end gap-4 rounded-2xl bg-gray-50 px-4 pb-3 md:flex dark:bg-neutral-900",
        className,
      )}
    >
      {items.map((item, idx) => {
        if ("type" in item && item.type === "separator") {
          return (
            <div
              key={`sep-${idx}`}
              className="h-8 w-px self-center bg-gray-300 dark:bg-neutral-700"
            />
          );
        }
        if ("type" in item && item.type === "profile") {
          const it = item as Extract<FloatingDockItem, { type: "profile" }>;
          return (
            <div key={`profile-${idx}`} className="self-end">
              <ProfileMenu user={it.user} />
            </div>
          );
        }
        const it = item as Exclude<FloatingDockItem, { type: "separator" | "profile" }>;
        return (
          <IconContainer
            mouseX={mouseX}
            key={it.title}
            title={it.title}
            icon={it.icon}
            href={it.href}
          />
        );
      })}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    if (typeof window === 'undefined' || !ref.current) {
      return 0;
    }

    const bounds = ref.current.getBoundingClientRect();
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 56, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 56, 40]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 28, 20]);
  const heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 28, 20],
  );

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex aspect-square items-center justify-center rounded-full bg-gray-200 dark:bg-neutral-800"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-8 left-1/2 w-fit rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs whitespace-pre text-neutral-700 dark:border-neutral-900 dark:bg-neutral-800 dark:text-white"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
}
