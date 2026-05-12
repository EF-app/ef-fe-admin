import { Pressable, Text, ScrollView, View } from 'react-native';

export interface ChipOption<T extends string | number> {
  value: T;
  label: string;
  badge?: number;
}

interface Props<T extends string | number> {
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
}

export default function FilterChips<T extends string | number>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 4 }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            className={`flex-row items-center gap-1 px-3 py-1.5 mr-2 rounded-full border ${
              active ? 'bg-point border-point' : 'bg-surface border-border'
            }`}
          >
            <Text
              className={`text-[12px] font-bold ${
                active ? 'text-white' : 'text-text-sub'
              }`}
            >
              {opt.label}
            </Text>
            {opt.badge != null && opt.badge > 0 && (
              <View
                className={`rounded-full px-1.5 ${active ? 'bg-white/30' : 'bg-danger'}`}
              >
                <Text className="text-[9px] font-extrabold text-white">{opt.badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
