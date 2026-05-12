import { useState } from 'react';
import {
  Redirect,
  Slot,
  useRouter,
  useSegments,
} from 'expo-router';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Home,
  Users,
  AlertTriangle,
  ShieldOff,
  CreditCard,
  Megaphone,
  Scale,
  StickyNote,
  Heart,
  FileText,
  Bug,
  Menu,
  X,
} from 'lucide-react-native';
import { useDashboardAlerts } from '@ef-fe-admin/shared';
import { useAuthStore } from '../../src/store/authStore';

type DashboardAlertKey =
  | 'pending_reports'
  | 'pending_refunds'
  | 'pending_bal_applies'
  | 'pending_profile_reviews';

interface MenuItem {
  key: string;
  label: string;
  route: string;
  icon: (color: string) => React.ReactNode;
  badgeKey?: DashboardAlertKey;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const SECTIONS: MenuSection[] = [
  {
    title: '운영',
    items: [
      { key: 'dashboard', label: '대시보드', route: '/(tabs)/dashboard', icon: (c) => <Home size={16} color={c} /> },
      { key: 'users', label: '유저 관리', route: '/(tabs)/users', icon: (c) => <Users size={16} color={c} /> },
      { key: 'reports', label: '신고 처리', route: '/(tabs)/reports', icon: (c) => <AlertTriangle size={16} color={c} />, badgeKey: 'pending_reports' },
      { key: 'suspensions', label: '제재 로그', route: '/(tabs)/suspensions', icon: (c) => <ShieldOff size={16} color={c} /> },
      { key: 'payments', label: '환불·결제', route: '/(tabs)/payments', icon: (c) => <CreditCard size={16} color={c} />, badgeKey: 'pending_refunds' },
    ],
  },
  {
    title: '콘텐츠',
    items: [
      { key: 'notices', label: '공지사항', route: '/(tabs)/notices', icon: (c) => <Megaphone size={16} color={c} /> },
      { key: 'balance', label: '밸런스 게임', route: '/(tabs)/balance', icon: (c) => <Scale size={16} color={c} />, badgeKey: 'pending_bal_applies' },
      { key: 'post-its', label: '포스트잇', route: '/(tabs)/post-its', icon: (c) => <StickyNote size={16} color={c} /> },
      { key: 'matching', label: '매칭 운영', route: '/(tabs)/matching', icon: (c) => <Heart size={16} color={c} /> },
    ],
  },
  {
    title: '시스템',
    items: [
      { key: 'audit', label: '감사 로그', route: '/(tabs)/audit', icon: (c) => <FileText size={16} color={c} /> },
      { key: 'feedback', label: '버그·기능', route: '/(tabs)/feedback', icon: (c) => <Bug size={16} color={c} /> },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);

function findActiveLabel(key: string): string {
  return ALL_ITEMS.find((i) => i.key === key)?.label ?? '관리';
}

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const admin = useAuthStore((s) => s.admin);
  const router = useRouter();
  const segments = useSegments() as string[];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: alerts } = useDashboardAlerts({
    refetchInterval: 60_000,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  const activeKey = segments[1] ?? 'dashboard';
  const activeLabel = findActiveLabel(activeKey);

  const handleNavigate = (route: string) => {
    setDrawerOpen(false);
    router.replace(route as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-border">
        <View className="flex-row items-center gap-2.5">
          <Pressable
            onPress={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-lg items-center justify-center"
            hitSlop={6}
          >
            <Menu size={20} color="#2B2730" />
          </Pressable>
          <Text className="font-extrabold text-[15px] text-text">{activeLabel}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="bg-point-softer rounded-full px-2.5 py-1">
            <Text className="text-[10px] font-bold text-point-dark">{admin?.role}</Text>
          </View>
          <View className="w-8 h-8 rounded-full bg-point items-center justify-center">
            <Text className="text-white font-extrabold text-[12px]">
              {admin?.name?.[0] ?? '관'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-1">
        <Slot />
      </View>

      <Modal
        visible={drawerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setDrawerOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDrawerOpen(false)}>
          <View className="flex-1 bg-black/40">
            <TouchableWithoutFeedback>
              <View className="bg-surface w-[280px] h-full">
                <SafeAreaView edges={['top']} className="flex-1">
                  <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
                    <View className="flex-row items-center gap-2.5">
                      <View className="w-9 h-9 rounded-lg bg-point items-center justify-center">
                        <Text className="text-white font-black text-[12px]">EF</Text>
                      </View>
                      <View>
                        <Text className="font-extrabold text-[14px] text-text">EF 관리자</Text>
                        <Text className="text-[10px] text-text-soft">{admin?.name ?? '관리자'}</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => setDrawerOpen(false)} hitSlop={6}>
                      <X size={20} color="#6B6573" />
                    </Pressable>
                  </View>

                  <ScrollView className="flex-1" contentContainerStyle={{ padding: 8 }}>
                    {SECTIONS.map((section) => (
                      <View key={section.title} className="mb-2">
                        <Text className="text-[10px] font-extrabold text-text-soft tracking-wider uppercase px-3 py-2 mt-2">
                          {section.title}
                        </Text>
                        {section.items.map((item) => {
                          const isActive = activeKey === item.key;
                          const badge = item.badgeKey ? alerts?.[item.badgeKey] : undefined;
                          return (
                            <Pressable
                              key={item.key}
                              onPress={() => handleNavigate(item.route)}
                              className={`flex-row items-center gap-2.5 px-3 py-2.5 rounded-md mb-0.5 ${
                                isActive ? 'bg-point' : ''
                              }`}
                            >
                              {item.icon(isActive ? '#FFFFFF' : '#6B6573')}
                              <Text
                                className={`flex-1 text-[13.5px] font-bold ${
                                  isActive ? 'text-white' : 'text-text-sub'
                                }`}
                              >
                                {item.label}
                              </Text>
                              {badge != null && badge > 0 && (
                                <View className="bg-danger rounded-full px-1.5 py-0.5">
                                  <Text className="text-[9px] font-extrabold text-white">
                                    {badge}
                                  </Text>
                                </View>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    ))}
                  </ScrollView>
                </SafeAreaView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
