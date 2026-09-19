import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, getPathname, usePathname, useRouter } = createNavigation(routing);
