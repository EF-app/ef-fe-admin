import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useRejectBalApplyMutation, type BalApply } from '@ef-fe-admin/shared';
import BottomSheet from '../../components/ui/BottomSheet';

interface Props {
  apply: BalApply | null;
  visible: boolean;
  onClose: () => void;
}

export default function RejectApplySheet({ apply, visible, onClose }: Props) {
  const [memo, setMemo] = useState('');

  const reject = useRejectBalApplyMutation({
    onSuccess: () => {
      setMemo('');
      onClose();
    },
  });

  const onSubmit = () => {
    if (!apply || !memo.trim()) return;
    reject.mutate({ id: apply.id, payload: { admin_memo: memo.trim() } });
  };

  return (
    <BottomSheet visible={visible} title="신청 반려" onClose={onClose}>
      {!apply ? null : (
        <View>
          <View className="bg-bg rounded-lg p-3 mb-4">
            <Text className="text-[12px] font-extrabold text-text">A. {apply.option_a}</Text>
            <Text className="text-[12px] font-extrabold text-text">B. {apply.option_b}</Text>
            <Text className="text-[11px] text-text-soft mt-1">@{apply.user_nickname ?? '-'}</Text>
          </View>

          <Text className="text-[12px] font-bold text-text-sub mb-1.5">반려 사유 (관리자 메모)</Text>
          <TextInput
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={3}
            placeholder="최소 5자"
            placeholderTextColor="#B0A9BA"
            className="border border-border rounded-lg px-3 py-2 text-[13px] text-text bg-bg mb-4 min-h-[70px]"
          />

          <Pressable
            onPress={onSubmit}
            disabled={reject.isPending || !memo.trim()}
            className={`rounded-lg py-3 items-center ${
              reject.isPending || !memo.trim() ? 'bg-point-softer' : 'bg-danger'
            }`}
          >
            <Text className="text-white font-extrabold text-[13px]">
              {reject.isPending ? '처리 중...' : '반려 처리'}
            </Text>
          </Pressable>
          <View className="h-4" />
        </View>
      )}
    </BottomSheet>
  );
}
