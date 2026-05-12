import { Text, View } from 'react-native';

type Variant = 'active' | 'warn' | 'danger' | 'neutral' | 'point' | 'success';

const styles: Record<Variant, { bg: string; text: string }> = {
  active: { bg: 'bg-success-soft', text: 'text-success-dark' },
  warn: { bg: 'bg-warn-soft', text: 'text-warn-dark' },
  danger: { bg: 'bg-danger-soft', text: 'text-danger' },
  neutral: { bg: 'bg-bg', text: 'text-text-sub' },
  point: { bg: 'bg-point-softer', text: 'text-point-dark' },
  success: { bg: 'bg-success-soft', text: 'text-success-dark' },
};

export default function Badge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  const s = styles[variant];
  return (
    <View className={`${s.bg} rounded-full px-2 py-1 self-start`}>
      <Text className={`${s.text} text-[10px] font-extrabold`}>{children}</Text>
    </View>
  );
}
