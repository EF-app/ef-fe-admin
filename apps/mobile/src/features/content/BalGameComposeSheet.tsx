import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import {
  useCreateBalGameMutation,
  useUpdateBalGameMutation,
  BAL_CATEGORIES,
  BAL_CATEGORY_MAP,
  BAL_GAME_STATUS_LABEL,
  formatNumber,
  type BalGame,
  type BalApply,
  type BalGameStatus,
  type BalGameUpsertRequest,
} from '@ef-fe-admin/shared';
import BottomSheet from '../../components/ui/BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  editTarget: BalGame | null;
  fromApply: BalApply | null;
}

const STATUSES: BalGameStatus[] = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'HIDDEN', 'ARCHIVED'];

interface FormState {
  option_a: string;
  option_a_desc: string;
  option_b: string;
  option_b_desc: string;
  description: string;
  category_id: number;
  status: BalGameStatus;
  scheduled_at: string;
  applicant_id: number | null;
  applicant_nickname?: string;
}

export default function BalGameComposeSheet({ visible, onClose, editTarget, fromApply }: Props) {
  const [form, setForm] = useState<FormState>(() => buildInitialForm(editTarget, fromApply));
  const [error, setError] = useState<string | null>(null);

  const editing = !!editTarget;

  const create = useCreateBalGameMutation({
    onSuccess: () => {
      setError(null);
      onClose();
    },
    onError: (e) => setError(e.message),
  });
  const update = useUpdateBalGameMutation({
    onSuccess: () => {
      setError(null);
      onClose();
    },
    onError: (e) => setError(e.message),
  });

  const pending = create.isPending || update.isPending;

  const onSubmit = () => {
    setError(null);
    if (!form.option_a.trim()) return setError('A 선택지를 입력해주세요.');
    if (!form.option_b.trim()) return setError('B 선택지를 입력해주세요.');
    if (form.status === 'SCHEDULED' && !form.scheduled_at.trim())
      return setError('예약 게시 시각을 입력해주세요.');

    const payload: BalGameUpsertRequest = {
      option_a: form.option_a.trim(),
      option_a_desc: form.option_a_desc.trim() || null,
      option_b: form.option_b.trim(),
      option_b_desc: form.option_b_desc.trim() || null,
      description: form.description.trim() || null,
      category_id: form.category_id,
      status: form.status,
      scheduled_at:
        form.status === 'SCHEDULED' && form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : null,
      applicant_id: form.applicant_id,
    };

    if (editing && editTarget) {
      update.mutate({ uuid: editTarget.uuid, payload });
    } else {
      create.mutate(payload);
    }
  };

  const category = BAL_CATEGORY_MAP[form.category_id];
  const total = editTarget ? editTarget.a_count + editTarget.b_count : 0;
  const aRatio = total > 0 ? Math.round((editTarget!.a_count / total) * 100) : 0;

  return (
    <BottomSheet
      visible={visible}
      title={editing ? '밸런스 게임 편집' : '새 밸런스 게임'}
      onClose={onClose}
    >
      <View>
        {fromApply && (
          <View className="bg-point-softer rounded-lg px-3 py-2 mb-4">
            <Text className="text-[11.5px] text-point-dark font-extrabold">
              💌 @{fromApply.user_nickname} 신청 반영
            </Text>
            <Text className="text-[10.5px] text-point-dark mt-0.5">
              승인된 내용을 초안으로 불러왔습니다. 확인 후 저장해주세요.
            </Text>
          </View>
        )}

        {editing && editTarget?.applicant_nickname && (
          <View className="bg-warn-soft rounded-lg px-3 py-2 mb-4">
            <Text className="text-[11px] text-warn-dark font-extrabold">
              신청자 @{editTarget.applicant_nickname} 의 게임입니다.
            </Text>
          </View>
        )}

        {editing && total > 0 && (
          <View className="bg-bg rounded-lg p-3 mb-4">
            <Text className="text-[11px] font-extrabold text-text-sub mb-2">투표 현황</Text>
            <View className="h-2 rounded-full bg-border overflow-hidden mb-1 flex-row">
              <View style={{ width: `${aRatio}%` }} className="bg-point h-full" />
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[10.5px] text-text-soft">
                A {formatNumber(editTarget!.a_count)} ({aRatio}%)
              </Text>
              <Text className="text-[10.5px] text-text-soft">
                B {formatNumber(editTarget!.b_count)} ({100 - aRatio}%)
              </Text>
            </View>
            <Text className="text-[10px] text-text-soft mt-1">
              댓글 {formatNumber(editTarget!.comment_count)}개 · v{editTarget!.version}
            </Text>
          </View>
        )}

        {/* Category */}
        <Text className="text-[12px] font-extrabold text-text-sub mb-2">카테고리</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {BAL_CATEGORIES.map((c) => {
            const active = form.category_id === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setForm({ ...form, category_id: c.id })}
                className={`flex-row items-center gap-1 mr-2 px-3 py-2 rounded-full border ${
                  active ? 'bg-point border-point' : 'bg-surface border-border'
                }`}
              >
                <Text className={active ? 'text-white' : ''}>{c.emoji}</Text>
                <Text
                  className={`text-[11.5px] font-extrabold ${
                    active ? 'text-white' : 'text-text-sub'
                  }`}
                >
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* A option */}
        <Text className="text-[12px] font-extrabold text-text-sub mb-1.5">A 선택지 *</Text>
        <TextInput
          value={form.option_a}
          onChangeText={(v) => setForm({ ...form, option_a: v })}
          placeholder="예: 여름 바다"
          placeholderTextColor="#B0A9BA"
          maxLength={255}
          className="border border-border rounded-lg px-3 py-2.5 text-[13px] text-text bg-bg mb-2"
        />
        <TextInput
          value={form.option_a_desc}
          onChangeText={(v) => setForm({ ...form, option_a_desc: v })}
          placeholder="A 설명 (선택, 최대 255자)"
          placeholderTextColor="#B0A9BA"
          maxLength={255}
          multiline
          className="border border-border rounded-lg px-3 py-2 text-[12.5px] text-text bg-bg mb-4 min-h-[56px]"
        />

        {/* B option */}
        <Text className="text-[12px] font-extrabold text-text-sub mb-1.5">B 선택지 *</Text>
        <TextInput
          value={form.option_b}
          onChangeText={(v) => setForm({ ...form, option_b: v })}
          placeholder="예: 겨울 눈밭"
          placeholderTextColor="#B0A9BA"
          maxLength={255}
          className="border border-border rounded-lg px-3 py-2.5 text-[13px] text-text bg-bg mb-2"
        />
        <TextInput
          value={form.option_b_desc}
          onChangeText={(v) => setForm({ ...form, option_b_desc: v })}
          placeholder="B 설명 (선택, 최대 255자)"
          placeholderTextColor="#B0A9BA"
          maxLength={255}
          multiline
          className="border border-border rounded-lg px-3 py-2 text-[12.5px] text-text bg-bg mb-4 min-h-[56px]"
        />

        {/* Description */}
        <Text className="text-[12px] font-extrabold text-text-sub mb-1.5">배경 설명</Text>
        <TextInput
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          placeholder="이 게임의 맥락을 알려주세요. (최대 500자)"
          placeholderTextColor="#B0A9BA"
          maxLength={500}
          multiline
          className="border border-border rounded-lg px-3 py-2 text-[12.5px] text-text bg-bg mb-1 min-h-[90px]"
        />
        <Text className="text-[10px] text-text-soft text-right mb-4">
          {form.description.length} / 500
        </Text>

        {/* Status */}
        <Text className="text-[12px] font-extrabold text-text-sub mb-2">게시 상태</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {STATUSES.map((s) => {
            const active = form.status === s;
            return (
              <Pressable
                key={s}
                onPress={() => setForm({ ...form, status: s })}
                className={`rounded-md px-3 py-2 border ${
                  active ? 'bg-point border-point' : 'bg-surface border-border'
                }`}
              >
                <Text
                  className={`text-[11px] font-extrabold ${
                    active ? 'text-white' : 'text-text-sub'
                  }`}
                >
                  {BAL_GAME_STATUS_LABEL[s]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Scheduled at */}
        {form.status === 'SCHEDULED' && (
          <View className="mb-4">
            <Text className="text-[12px] font-extrabold text-text-sub mb-1.5">
              예약 게시 시각
            </Text>
            <TextInput
              value={form.scheduled_at}
              onChangeText={(v) => setForm({ ...form, scheduled_at: v })}
              placeholder="YYYY-MM-DD HH:mm"
              placeholderTextColor="#B0A9BA"
              className="border border-border rounded-lg px-3 py-2.5 text-[13px] text-text bg-bg"
            />
            <Text className="text-[10px] text-text-soft mt-1">
              예: 2026-04-22 09:00
            </Text>
          </View>
        )}

        {/* Preview */}
        <Text className="text-[12px] font-extrabold text-text-sub mb-2">앱 미리보기</Text>
        <View className="rounded-2xl border border-border bg-bg p-4 mb-4">
          {category && (
            <View className="bg-point-soft rounded-full self-start px-2.5 py-0.5 mb-2">
              <Text className="text-[10.5px] font-extrabold text-point-dark">
                {category.emoji} {category.name}
              </Text>
            </View>
          )}
          {form.description ? (
            <Text className="text-[12.5px] text-text-sub mb-3">{form.description}</Text>
          ) : null}
          <View className="flex-row items-center">
            <View className="flex-1 bg-surface rounded-xl border border-border p-3 min-h-[90px]">
              <Text className="text-[10px] font-extrabold text-point-dark mb-1">A</Text>
              <Text className="text-[13px] font-extrabold text-text" numberOfLines={2}>
                {form.option_a || '—'}
              </Text>
              {form.option_a_desc ? (
                <Text className="text-[10.5px] text-text-soft mt-1" numberOfLines={2}>
                  {form.option_a_desc}
                </Text>
              ) : null}
            </View>
            <View className="w-8 h-8 rounded-full bg-point items-center justify-center mx-2">
              <Text className="text-white text-[10px] font-black">VS</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl border border-border p-3 min-h-[90px]">
              <Text className="text-[10px] font-extrabold text-point-dark mb-1">B</Text>
              <Text className="text-[13px] font-extrabold text-text" numberOfLines={2}>
                {form.option_b || '—'}
              </Text>
              {form.option_b_desc ? (
                <Text className="text-[10.5px] text-text-soft mt-1" numberOfLines={2}>
                  {form.option_b_desc}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {error && (
          <View className="bg-danger-soft rounded-md px-3 py-2 mb-3">
            <Text className="text-danger text-[11.5px] font-bold">{error}</Text>
          </View>
        )}

        <Pressable
          onPress={onSubmit}
          disabled={pending}
          className={`rounded-lg py-3 items-center ${pending ? 'bg-point-softer' : 'bg-point'}`}
        >
          <Text className="text-white font-extrabold text-[13px]">
            {pending ? '저장 중...' : editing ? '변경 저장' : '게임 생성'}
          </Text>
        </Pressable>
        <View className="h-6" />
      </View>
    </BottomSheet>
  );
}

function buildInitialForm(editTarget: BalGame | null, fromApply: BalApply | null): FormState {
  if (editTarget) {
    return {
      option_a: editTarget.option_a,
      option_a_desc: editTarget.option_a_desc ?? '',
      option_b: editTarget.option_b,
      option_b_desc: editTarget.option_b_desc ?? '',
      description: editTarget.description ?? '',
      category_id: editTarget.category_id ?? 2,
      status: editTarget.status,
      scheduled_at: editTarget.scheduled_at ? toDateTimeInput(editTarget.scheduled_at) : '',
      applicant_id: editTarget.applicant_id,
      applicant_nickname: editTarget.applicant_nickname,
    };
  }
  if (fromApply) {
    return {
      option_a: fromApply.option_a,
      option_a_desc: '',
      option_b: fromApply.option_b,
      option_b_desc: '',
      description: fromApply.description ?? '',
      category_id: fromApply.category_id ?? 2,
      status: 'DRAFT',
      scheduled_at: '',
      applicant_id: fromApply.user_id,
      applicant_nickname: fromApply.user_nickname,
    };
  }
  return {
    option_a: '',
    option_a_desc: '',
    option_b: '',
    option_b_desc: '',
    description: '',
    category_id: 2,
    status: 'DRAFT',
    scheduled_at: '',
    applicant_id: null,
  };
}

function toDateTimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
