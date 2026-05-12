import { Modal, Pressable, View, Text, ScrollView } from 'react-native';
import { ReactNode } from 'react';
import { X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function BottomSheet({ visible, title, onClose, children, footer }: Props) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-surface rounded-t-2xl pt-4 pb-6 max-h-[85%]"
        >
          <View className="items-center mb-2">
            <View className="w-10 h-1 bg-border rounded-full" />
          </View>
          {title && (
            <View className="flex-row items-center justify-between px-5 pb-3 border-b border-border">
              <Text className="text-[15px] font-extrabold text-text">{title}</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <X size={20} color="#6B6573" />
              </Pressable>
            </View>
          )}
          <ScrollView className="px-5 py-4">{children}</ScrollView>
          {footer && <View className="px-5 pt-3 border-t border-border">{footer}</View>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
