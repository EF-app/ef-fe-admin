import { useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Plus } from 'lucide-react-native';
import {
  useNotices,
  formatDateTime,
  NOTICE_STATUS_LABEL,
  type Notice,
} from '@ef-fe-admin/shared';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import NoticeWriteSheet from '../../content/NoticeWriteSheet';

export default function NoticesScreen() {
  const [writeOpen, setWriteOpen] = useState(false);
  const { data, isLoading } = useNotices({ page: 0, size: 20 });

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-4 pb-2 flex-row justify-end">
        <Pressable
          onPress={() => setWriteOpen(true)}
          className="flex-row items-center gap-1.5 bg-point rounded-md px-3 py-2"
        >
          <Plus size={14} color="#fff" />
          <Text className="text-white text-[12px] font-extrabold">작성</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9686BF" />
        </View>
      ) : (
        <FlatList<Notice>
          data={data?.content ?? []}
          keyExtractor={(n) => n.uuid}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<EmptyState message="공지가 없습니다" />}
          renderItem={({ item }) => (
            <View className="bg-surface border border-border rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-[13px] font-extrabold text-text flex-1 mr-2" numberOfLines={1}>
                  {item.title}
                </Text>
                <Badge
                  variant={
                    item.status === 'SENT'
                      ? 'active'
                      : item.status === 'SCHEDULED'
                      ? 'warn'
                      : 'neutral'
                  }
                >
                  {NOTICE_STATUS_LABEL[item.status]}
                </Badge>
              </View>
              <Text className="text-[12px] text-text-sub mb-2" numberOfLines={2}>
                {item.body}
              </Text>
              <Text className="text-[10px] text-text-soft">
                {item.sent_at ? formatDateTime(item.sent_at) : formatDateTime(item.create_time)}
                {item.status === 'SENT' && ` · ${item.sent_count.toLocaleString()}명 수신`}
              </Text>
            </View>
          )}
        />
      )}

      <NoticeWriteSheet visible={writeOpen} onClose={() => setWriteOpen(false)} />
    </View>
  );
}
