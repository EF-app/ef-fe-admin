import { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import {
  useCreateNoticeMutation,
  useSendNoticeMutation,
  NOTICE_TARGET_TYPE_LABEL,
  validators,
  type NoticeTargetType,
} from '@ef-fe-admin/shared';
import BottomSheet from '../../components/ui/BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const TARGETS: NoticeTargetType[] = ['ALL', 'IOS', 'ANDROID', 'PREMIUM', 'SEGMENT'];

export default function NoticeWriteSheet({ visible, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<NoticeTargetType>('ALL');
  const [error, setError] = useState<string | null>(null);

  const create = useCreateNoticeMutation({
    onSuccess: (notice) => {
      send.mutate(notice.uuid, {
        onSuccess: () => {
          setTitle('');
          setBody('');
          onClose();
        },
      });
    },
  });
  const send = useSendNoticeMutation();

  const onSubmit = () => {
    setError(null);
    const tCheck = validators.noticeTitle(title);
    const bCheck = validators.noticeBody(body);
    if (!tCheck.valid) return setError(tCheck.message ?? '');
    if (!bCheck.valid) return setError(bCheck.message ?? '');
    create.mutate({ title: title.trim(), body: body.trim(), target_type: target });
  };

  const pending = create.isPending || send.isPending;

  return (
    <BottomSheet visible={visible} title="공지 작성" onClose={onClose}>
      <View>
        <Text className="text-[12px] font-bold text-text-sub mb-1.5">제목</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="공지 제목"
          placeholderTextColor="#B0A9BA"
          className="border border-border rounded-lg px-3 py-2.5 text-[14px] text-text bg-bg mb-4"
        />

        <Text className="text-[12px] font-bold text-text-sub mb-1.5">본문</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={6}
          placeholder="공지 본문"
          placeholderTextColor="#B0A9BA"
          className="border border-border rounded-lg px-3 py-2 text-[13px] text-text bg-bg mb-4 min-h-[130px]"
        />

        <Text className="text-[12px] font-bold text-text-sub mb-1.5">발송 대상</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {TARGETS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTarget(t)}
              className={`rounded-md px-3 py-2 border ${
                target === t ? 'bg-point border-point' : 'bg-surface border-border'
              }`}
            >
              <Text
                className={`text-[11px] font-extrabold ${
                  target === t ? 'text-white' : 'text-text-sub'
                }`}
              >
                {NOTICE_TARGET_TYPE_LABEL[t]}
              </Text>
            </Pressable>
          ))}
        </View>

        {error && (
          <View className="bg-danger-soft rounded-md px-3 py-2 mb-3">
            <Text className="text-danger text-[11px] font-bold">{error}</Text>
          </View>
        )}

        <Pressable
          onPress={onSubmit}
          disabled={pending}
          className={`rounded-lg py-3 items-center ${pending ? 'bg-point-softer' : 'bg-point'}`}
        >
          <Text className="text-white font-extrabold text-[13px]">
            {pending ? '발송 중...' : '작성 및 발송'}
          </Text>
        </Pressable>
        <View className="h-4" />
      </View>
    </BottomSheet>
  );
}
