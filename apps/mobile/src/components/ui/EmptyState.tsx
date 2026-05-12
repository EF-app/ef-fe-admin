import { View, Text } from 'react-native';
import { Inbox } from 'lucide-react-native';

export default function EmptyState({ message = '데이터가 없습니다' }: { message?: string }) {
  return (
    <View className="items-center py-10">
      <Inbox size={40} color="#B0A9BA" />
      <Text className="text-[13px] text-text-soft mt-3">{message}</Text>
    </View>
  );
}
