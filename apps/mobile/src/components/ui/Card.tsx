import { View, ViewProps } from 'react-native';
import { ReactNode } from 'react';

export default function Card({
  children,
  className = '',
  ...rest
}: ViewProps & { children: ReactNode; className?: string }) {
  return (
    <View
      className={`bg-surface rounded-xl border border-border p-4 ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
