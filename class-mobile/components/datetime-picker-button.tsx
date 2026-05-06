import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

type Props = {
  value: Date;
  onChange: (d: Date) => void;
};

export function DateTimePickerButton({ value, onChange }: Props) {
  const [androidStep, setAndroidStep] = useState<'idle' | 'date' | 'time'>('idle');
  const [iosVisible, setIosVisible] = useState(false);

  function open() {
    if (Platform.OS === 'android') {
      setAndroidStep('date');
    } else {
      setIosVisible(true);
    }
  }

  function handleAndroidDate(event: DateTimePickerEvent, selected?: Date) {
    if (event.type !== 'set' || !selected) {
      setAndroidStep('idle');
      return;
    }
    const updated = new Date(value);
    updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    onChange(updated);
    setAndroidStep('time');
  }

  function handleAndroidTime(event: DateTimePickerEvent, selected?: Date) {
    if (event.type === 'set' && selected) {
      const updated = new Date(value);
      updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onChange(updated);
    }
    setAndroidStep('idle');
  }

  function handleIosChange(_event: DateTimePickerEvent, selected?: Date) {
    if (selected) onChange(selected);
  }

  const formatted = value.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <Pressable
        onPress={open}
        className="mt-3 bg-gray-50 rounded-xl px-3 py-3 active:bg-gray-100"
      >
        <Text className="text-[14px] text-gray-900">{formatted}</Text>
      </Pressable>

      {Platform.OS === 'android' && androidStep === 'date' ? (
        <DateTimePicker value={value} mode="date" onChange={handleAndroidDate} />
      ) : null}
      {Platform.OS === 'android' && androidStep === 'time' ? (
        <DateTimePicker value={value} mode="time" onChange={handleAndroidTime} />
      ) : null}

      <Modal
        visible={iosVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIosVisible(false)}
      >
        <Pressable
          onPress={() => setIosVisible(false)}
          className="flex-1 bg-black/40 justify-center items-center px-5"
        >
          <View
            className="bg-white rounded-2xl p-4 w-full max-w-md"
            onStartShouldSetResponder={() => true}
          >
            <DateTimePicker
              value={value}
              mode="datetime"
              display="spinner"
              onChange={handleIosChange}
              locale="ko-KR"
            />
            <Pressable
              onPress={() => setIosVisible(false)}
              className="bg-brand-500 rounded-2xl py-3 items-center active:bg-brand-600 mt-2"
            >
              <Text className="text-white text-base font-semibold">완료</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
