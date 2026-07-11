import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

const TABS = [
  { to: '/', label: 'Trang chủ', icon: 'home', end: true },
  { to: '/missions', label: 'Nhiệm vụ', icon: 'star', end: false },
  { to: '/rewards', label: 'Đổi điểm', icon: 'gift', end: true },
  { to: '/services', label: 'Dịch vụ', icon: 'grid', end: false },
  { to: '/account', label: 'Tài khoản', icon: 'user', end: false },
];

export function BottomNav() {
  return (
    <nav className="bottomnav">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon name={t.icon} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
