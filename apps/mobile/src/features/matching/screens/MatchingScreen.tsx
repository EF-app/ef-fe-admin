import { View, Text } from 'react-native';

export default function MatchingScreen() {
  return (
    <View className="flex-1 bg-bg items-center justify-center px-6">
      <Text className="text-[15px] font-extrabold text-text mb-2">매칭 운영</Text>
      <Text className="text-[12px] text-text-soft text-center">
        매칭 알고리즘 가중치 조정과 일별 매칭 통계를 보는 화면입니다.{'\n'}
        (백엔드 매칭 모듈 확정 후 연결 예정)
      </Text>
    </View>
  );
}
